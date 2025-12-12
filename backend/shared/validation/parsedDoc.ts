/**
 * Parsed document validation using Zod
 * Validates the structure returned from PDF parsing
 */

import { z } from "zod";

export const ParsedItemSchema = z.object({
  supplier: z.string().optional(),
  product: z.string().min(1, "Product name is required"),
  // Accept any number and round to integer (LLM sometimes returns floats like 3.0)
  quantity: z.number().nonnegative().transform(val => Math.round(val)).optional(),
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
export function validateParsedDoc(
  input: unknown
): { items: ParsedItem[] } {
  try {
    const result = ParsedDocSchema.safeParse(input);
    if (!result.success) {
      console.warn("Parsed doc validation failed:", result.error.errors);
      return { items: [] };
    }
    
    // Filter out suspicious items
    const filteredItems = result.data.items.filter(item => {
      const product = item.product?.trim() || '';
      
      // Must have a product name of at least 3 characters
      if (product.length < 3) {
        console.log(`[validation] Filtered out item with short product name: "${product}"`);
        return false;
      }
      
      // Filter out items that are just numbers or codes
      if (/^\d+$/.test(product)) {
        console.log(`[validation] Filtered out numeric-only product: "${product}"`);
        return false;
      }
      
      // Filter out items that look like headers or metadata
      const lowerProduct = product.toLowerCase();
      const suspiciousPatterns = [
        'total', 'subtotal', 'tax', 'discount', 'page', 'printed',
        'location', 'sales report', 'stock item', 'unit price',
        'quantity', 'nett', 'gross'
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (lowerProduct.includes(pattern)) {
          console.log(`[validation] Filtered out metadata item: "${product}"`);
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`[validation] Validated ${filteredItems.length} items (filtered ${result.data.items.length - filteredItems.length})`);
    
    return { items: filteredItems };
  } catch (err) {
    console.warn("Parsed doc validation error:", err);
    return { items: [] };
  }
}

/**
 * Validates a single parsed item
 */
export function validateParsedItem(
  input: unknown
): ParsedItem | null {
  try {
    const result = ParsedItemSchema.safeParse(input);
    if (!result.success) {
      return null;
    }
    return result.data;
  } catch {
    return null;
  }
}

