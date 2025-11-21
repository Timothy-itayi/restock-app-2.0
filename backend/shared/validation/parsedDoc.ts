/**
 * Parsed document validation using Zod
 * Validates the structure returned from PDF parsing
 */

import { z } from "zod";

export const ParsedItemSchema = z.object({
  supplier: z.string().optional(),
  product: z.string().min(1, "Product name is required"),
  quantity: z.number().int().nonnegative().optional(),
});

export const ParsedDocSchema = z.object({
  items: z.array(ParsedItemSchema),
});

export type ParsedItem = z.infer<typeof ParsedItemSchema>;
export type ParsedDoc = z.infer<typeof ParsedDocSchema>;

/**
 * Validates parsed document response
 * Returns validated items or empty array on failure
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
    return result.data;
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

