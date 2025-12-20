/**
 * Parsed document validation using Zod
 * Validates the structure returned from PDF parsing
 */

import { z } from "zod";

/**
 * Fixes common quantity parsing errors
 * Returns corrected quantity or null if unfixable
 */
function sanitizeQuantity(quantity: number, product: string): number | null {
  // Already a reasonable quantity
  if (quantity >= 0 && quantity <= 500) {
    return Math.round(quantity);
  }

  // Likely decimal parse error: 1.000 → 1000, 6.000 → 6000
  // Fix by dividing by 1000
  if (quantity >= 1000 && quantity <= 500000 && quantity % 1000 === 0) {
    const fixed = quantity / 1000;
    console.log(`[validation] Fixed quantity ${quantity} → ${fixed} for "${product}" (decimal parse error)`);
    return fixed;
  }

  // Quantity looks like a 5-digit SKU (10000-99999)
  if (quantity >= 10000 && quantity <= 99999) {
    console.log(`[validation] Rejected quantity ${quantity} for "${product}" (looks like SKU)`);
    return null;
  }

  // Unreasonably large quantity (> 500 and not fixable)
  if (quantity > 500) {
    console.log(`[validation] Rejected quantity ${quantity} for "${product}" (too large)`);
    return null;
  }

  // Negative quantities
  if (quantity < 0) {
    console.log(`[validation] Rejected negative quantity ${quantity} for "${product}"`);
    return null;
  }

  return Math.round(quantity);
}

/**
 * Cleans supplier name by removing email suffixes
 */
function sanitizeSupplier(supplier: string | undefined): string | undefined {
  if (!supplier) return undefined;

  let cleaned = supplier.trim();

  // Remove common suffixes
  const suffixPatterns = [
    / - S EMail$/i,
    / - Box of \d+ EMail$/i,
    / - \d+ box min$/i,
    / - Box EMail$/i,
    / EMail$/i,
    / Email$/i,
  ];

  for (const pattern of suffixPatterns) {
    cleaned = cleaned.replace(pattern, "");
  }

  return cleaned.trim() || undefined;
}

/**
 * Cleans product name
 */
function sanitizeProduct(product: string): string {
  let cleaned = product.trim();

  // Remove leading asterisks (e.g., "*Delice de Bourgogne" → "Delice de Bourgogne")
  cleaned = cleaned.replace(/^\*+\s*/, "");

  // Remove leading/trailing SKU-like patterns if product name exists
  // e.g., "14001 Meredith Cheese" → "Meredith Cheese" (only if text follows)
  cleaned = cleaned.replace(/^\d{5}\s+/, "");

  return cleaned.trim();
}

export const ParsedItemSchema = z.object({
  supplier: z.string().optional(),
  product: z.string().min(1, "Product name is required"),
  // Accept any number - we'll sanitize it in the validation function
  quantity: z
    .number()
    .optional()
    .transform((val) => (val !== undefined ? Math.round(val) : undefined)),
});

export const ParsedDocSchema = z.object({
  items: z.array(ParsedItemSchema),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;
export type ParsedDoc = z.infer<typeof ParsedDocSchema>;

/**
 * Validates parsed document response
 * Returns validated items or empty array on failure
 * Filters out likely hallucinated or invalid items
 */
export function validateParsedDoc(input: unknown): { items: ParsedItem[] } {
  try {
    const result = ParsedDocSchema.safeParse(input);
    if (!result.success) {
      console.warn("Parsed doc validation failed:", result.error.errors);
      return { items: [] };
    }

    // Filter and sanitize items
    const filteredItems: ParsedItem[] = [];

    for (const item of result.data.items) {
      const product = sanitizeProduct(item.product || "");

      // Must have a product name of at least 3 characters
      if (product.length < 3) {
        console.log(
          `[validation] Filtered out item with short product name: "${product}"`
        );
        continue;
      }

      // Filter out items that are just numbers or codes
      if (/^\d+$/.test(product)) {
        console.log(
          `[validation] Filtered out numeric-only product: "${product}"`
        );
        continue;
      }

      // Filter out items that look like headers or metadata
      const lowerProduct = product.toLowerCase();
      const suspiciousPatterns = [
        "total",
        "subtotal",
        "tax",
        "discount",
        "page",
        "printed",
        "location",
        "sales report",
        "stock item",
        "unit price",
        "quantity",
        "nett",
        "gross",
        "gst",
        "inc",
        "ex",
      ];

      let isSuspicious = false;
      for (const pattern of suspiciousPatterns) {
        if (lowerProduct === pattern || lowerProduct.startsWith(pattern + " ")) {
          console.log(`[validation] Filtered out metadata item: "${product}"`);
          isSuspicious = true;
          break;
        }
      }
      if (isSuspicious) continue;

      // Sanitize and validate quantity
      let quantity = item.quantity;
      if (quantity !== undefined) {
        const sanitized = sanitizeQuantity(quantity, product);
        if (sanitized === null) {
          // Quantity was unfixable - skip this item or set to undefined
          // Setting to undefined so user can manually enter quantity
          console.log(
            `[validation] Setting quantity to undefined for "${product}" (was ${quantity})`
          );
          quantity = undefined;
        } else {
          quantity = sanitized;
        }
      }

      // Sanitize supplier name
      const supplier = sanitizeSupplier(item.supplier);

      filteredItems.push({
        product,
        quantity,
        supplier,
      });
    }

    console.log(
      `[validation] Validated ${filteredItems.length} items (filtered ${result.data.items.length - filteredItems.length})`
    );

    return { items: filteredItems };
  } catch (err) {
    console.warn("Parsed doc validation error:", err);
    return { items: [] };
  }
}

/**
 * Validates a single parsed item
 */
export function validateParsedItem(input: unknown): ParsedItem | null {
  try {
    const result = ParsedItemSchema.safeParse(input);
    if (!result.success) {
      return null;
    }

    // Apply same sanitization
    const product = sanitizeProduct(result.data.product);
    if (product.length < 3) return null;

    let quantity = result.data.quantity;
    if (quantity !== undefined) {
      const sanitized = sanitizeQuantity(quantity, product);
      quantity = sanitized ?? undefined;
    }

    return {
      product,
      quantity,
      supplier: sanitizeSupplier(result.data.supplier),
    };
  } catch {
    return null;
  }
}