/**
 * Text normalization utilities
 * Used for cleaning supplier and product names
 */

/**
 * Normalizes a string by:
 * - Trimming whitespace
 * - Converting to lowercase
 * - Removing duplicate punctuation
 * - Collapsing multiple spaces
 */
export function normalize(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    .trim()
    .toLowerCase()
    .replace(/[.!?]{2,}/g, ".") // Remove duplicate punctuation
    .replace(/\s+/g, " ") // Collapse spaces
    .trim();
}

/**
 * Normalizes supplier name
 * Additional cleaning for supplier names
 */
export function normalizeSupplier(name: string): string {
  const normalized = normalize(name);
  // Remove common suffixes that might cause duplicates
  return normalized
    .replace(/\s+(ltd|limited|inc|incorporated|corp|corporation)\.?$/i, "")
    .trim();
}

/**
 * Normalizes product name
 * Preserves product-specific formatting
 */
export function normalizeProduct(name: string): string {
  return normalize(name);
}

