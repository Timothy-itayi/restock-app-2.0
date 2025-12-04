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
    { "supplier": "<string or empty>", "product": "<string>", "quantity": <number> }
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
- Quantity MUST be extracted if present in the document - look for columns like "Qty", "Order", "Amount", or numbers next to products
- Do NOT default quantity to 1 - only use the actual value from the document
- Omit quantity field only if genuinely not present in the source document
- Return empty array if no items found`;
}

/**
 * Creates a vision API prompt for scanned PDFs
 * Uses the specific prompt format for product list extraction
 */
export function buildVisionPrompt(): string {
  return `You are a precise OCR system. Extract product names and quantities EXACTLY as written in this image.

This appears to be a stock/sales report or product catalog. Look for:
- Supplier/brand headers (e.g., "SHER WAGYU", "BELLCO - Box EMail", "BLUE PUMPKIN")
- Product names with codes (e.g., "19303 Careme - Puff Pastry", "27437 Mario - Butter Salted 250g")
- Quantities (numbers indicating how many units, often in columns labeled "Qty", "Order", "Amount", or just numbers next to products)

CRITICAL RULES:
1. Extract text EXACTLY as written - do not correct spelling or interpret
2. Copy the exact product name from the document
3. DO NOT invent, guess, or hallucinate products that are not clearly visible
4. If text is unclear, skip that item rather than guess
5. Supplier names appear as section headers in CAPS or bold
6. Product codes (numbers) at the start of lines can be ignored - these are SKUs not quantities
7. ALWAYS look for and extract the quantity - it's usually in a separate column or after the product name
8. Quantities are typically small integers (1-100), not product codes (which are often 4-6 digits)

For each visible product line, extract:
- supplier: The section header it appears under (e.g., "BELLCO", "BLUE PUMPKIN")
- product: The exact product name as written (e.g., "Careme - Puff Pastry", "CoYo - 500g Greek")
- quantity: The number of units to order (e.g., 2, 5, 10) - REQUIRED if visible in document

Return ONLY valid JSON:
{
  "items": [
    {"supplier": "BELLCO", "product": "Careme - Puff Pastry", "quantity": 3},
    {"supplier": "BELLCO", "product": "Carmans - Bars Choc Cranberry", "quantity": 2},
    {"supplier": "BLUE PUMPKIN", "product": "Babushka - Coconut Kefir 500g", "quantity": 1}
  ]
}

ACCURACY IS MORE IMPORTANT THAN COMPLETENESS.
If you cannot clearly read a product name, DO NOT include it.
Never make up products that are not in the image.
ALWAYS include quantity if it is visible in the document - do not default to 1 unless that is what is written.`;
}

