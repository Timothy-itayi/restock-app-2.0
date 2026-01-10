/**
 * LLM prompt builder for structured extraction
 * Converts supplier blocks to JSON-only prompts
 */

import type { SupplierBlock } from "./blockParser";

/**
 * Creates a structured prompt for Groq/OpenAI to extract items
 * Returns JSON-only response format
 */
export function buildExtractionPrompt(blocks: SupplierBlock[]): string {
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

DOCUMENT CONTEXT:
This is a printed stock report showing last week's sales. Managers annotate it by hand:
- HANDWRITTEN NUMBER in left margin = override quantity (order this many)
- CROSSED OUT / STRIKETHROUGH = skip entirely (don't order)
- NO ANNOTATION = use the printed Quantity column value

CRITICAL - DECIMAL HANDLING:
The printed Quantity column uses DECIMAL FORMAT with periods:
- "1.000" means ONE (1), not one thousand
- "6.000" means SIX (6)
- "12.500" means TWELVE point FIVE, round to 13
- ALWAYS interpret periods as DECIMAL POINTS, never as thousand separators

QUANTITY RULES (in order):
1. Handwritten number in left margin → USE THIS (already an integer)
2. Item crossed out → SKIP ENTIRELY
3. No annotation → Use printed Quantity column, ROUNDED to nearest integer

Return ONLY this JSON shape (no markdown, no comments, no extra text):

{
  "items": [
    { "supplier": "<string or empty>", "product": "<string>", "quantity": <integer> }
  ]
}

Rules:
- quantity must be an INTEGER (whole number)
- "1.000" in print = quantity 1, "6.000" = quantity 6, "9.458" = quantity 9
- Handwritten quantities are already integers (10, 5, 3, etc.)
- SKU codes (5-digit numbers like 14001) are NOT quantities
- Strip asterisks from product names (*Delice → Delice)
- Strip supplier suffixes: " - S EMail", " - Box of 4 EMail", " - 12 box min"
- Return empty array if no items found`;
}

/**
 * Creates a flexible vision API prompt that handles various product list formats
 * Supports: spreadsheets, handwritten lists, invoices, order forms, stock reports
 */
export function buildVisionPrompt(): string {
  return `You are extracting product/item information from an image.

═══════════════════════════════════════════════════════════════════════════════
SUPPORTED FORMATS
═══════════════════════════════════════════════════════════════════════════════

This image may be ANY of these formats:
- Inventory list or stock report (printed or handwritten)
- Order form or purchase order
- Sales report or price list
- Spreadsheet or printed table
- Handwritten notes with product names
- Invoice or receipt with line items

Your job: Find ALL products/items and their quantities, regardless of format.

═══════════════════════════════════════════════════════════════════════════════
WHAT TO EXTRACT
═══════════════════════════════════════════════════════════════════════════════

1. PRODUCT NAMES
   - The name/description of each item
   - Remove SKU codes, asterisks, or reference numbers
   - Keep brand names if part of the product (e.g., "Meredith - Chevre Plain")

2. QUANTITIES (integers only)
   - Look for numbers associated with each product
   - Handwritten numbers take priority over printed
   - Decimals (1.000, 6.50) → round to nearest integer (1, 7)
   - If no quantity visible → default to 1
   - Crossed-out/struck-through items → SKIP entirely

3. SUPPLIER/VENDOR (optional)
   - Section headers or labels indicating the supplier
   - Remove email suffixes: " - S EMail", " - Email", etc.
   - If no supplier visible → leave empty

═══════════════════════════════════════════════════════════════════════════════
FORMAT-SPECIFIC HINTS
═══════════════════════════════════════════════════════════════════════════════

SPREADSHEET/TABLE FORMAT:
- Look for columns: Product Name, Quantity, Description, Qty, Amount
- Ignore: Price, Tax, SKU, Total columns
- Quantity column may use decimals (1.000 = 1, not 1000)

HANDWRITTEN NOTES:
- Numbers written next to or near product names are quantities
- Circled or underlined items should be included
- Crossed-out items should be SKIPPED

ANNOTATED REPORTS:
- Handwritten numbers in margins override printed values
- Struck-through rows = do not include

═══════════════════════════════════════════════════════════════════════════════
WHAT TO IGNORE
═══════════════════════════════════════════════════════════════════════════════

- SKU codes (5-digit numbers like 14001, 24931) — NOT quantities
- Prices, totals, subtotals, tax amounts
- Page headers, footers, dates, store names
- Crossed-out or struck-through items
- Reference numbers, barcodes

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

If products ARE found, return:
{
  "items": [
    {"supplier": "Supplier Name", "product": "Product Name", "quantity": 5},
    {"supplier": "", "product": "Another Product", "quantity": 1}
  ]
}

If this image does NOT contain a product list (e.g., a photo of a person, 
landscape, unrelated document), return:
{
  "items": [],
  "error": "not_product_list"
}

═══════════════════════════════════════════════════════════════════════════════
VALIDATION
═══════════════════════════════════════════════════════════════════════════════

Before returning:
☐ Quantities are integers between 1-500 (anything larger is likely an error)
☐ Product names are readable strings (not codes or numbers)
☐ Decimals like "1.000" parsed as 1, not 1000
☐ Crossed-out items excluded

Return ONLY valid JSON. No markdown code fences. No explanations.`;
}