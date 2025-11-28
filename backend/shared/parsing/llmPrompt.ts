/**
 * LLM prompt builder for structured extraction
 * Converts supplier blocks to JSON-only prompts
 */

import type { SupplierBlock } from "./blockParser";

/**
 * Creates a structured prompt for Groq/OpenAI to extract items
 * Returns JSON-only response format
 */
export function buildExtractionPrompt(
  blocks: SupplierBlock[]
): string {
  if (blocks.length === 0) {
    return getBasePrompt("");
  }

  // Format blocks for the prompt
  const formattedBlocks = blocks
    .map((block) => {
      if (block.supplierName) {
        return `SUPPLIER: ${block.supplierName}\n${block.lines.join("\n")}`;
      }
      return block.lines.join("\n");
    })
    .join("\n\n---\n\n");

  return getBasePrompt(formattedBlocks);
}

/**
 * Base prompt template
 */
function getBasePrompt(content: string): string {
  return `Extract a clean JSON array of supplier items from the following document.

${content ? `Document content:\n${content}` : "No content provided."}

Return ONLY this JSON shape (no markdown, no comments, no extra text):

{
  "items": [
    { "supplier": "<string or empty>", "product": "<string>", "quantity": <number or omit> }
  ]
}

Rules:
- No extra text outside the JSON
- No markdown formatting
- No comments or explanations
- Ignore empty rows
- Ignore prices, totals, discounts, metadata
- Supplier may be empty string if not identifiable
- Product must be a readable product name
- Quantity is optional, only include if clearly stated
- Return empty array if no items found`;
}

/**
 * Creates a vision API prompt for scanned PDFs
 * Uses the specific prompt format for product list extraction
 */
export function buildVisionPrompt(): string {
  return `Look at this image and extract every product name you can see.

This is a product catalog or order list. Extract each line item as a product.

For each product, identify:
1. The product name (the main text)
2. The supplier/brand name if visible (often shown as a header or prefix)

Return JSON in this exact format:
{
  "items": [
    {"supplier": "SUPPLIER NAME", "product": "Product Name Here"}
  ]
}

Important:
- Include EVERY product line you can read
- If no supplier is visible, use ""
- Just extract what you see, don't skip any items
- Even partial or unclear text should be included`;
}

