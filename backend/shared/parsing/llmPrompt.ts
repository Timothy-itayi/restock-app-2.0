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
 * Creates a vision API prompt for scanned stock reports
 * Handles handwritten annotations and decimal quantity parsing
 */
export function buildVisionPrompt(): string {
  return `You are extracting restock orders from an annotated "Stock Item Sales Report" image.

CONTEXT: This printed report shows LAST WEEK'S SALES. A store manager has walked through 
the store and annotated it by hand to create their restock order.

═══════════════════════════════════════════════════════════════════════════════
THE THREE ANNOTATION TYPES
═══════════════════════════════════════════════════════════════════════════════

1. HANDWRITTEN NUMBER (left margin, before SKU)
   → Manager wants to order THIS quantity (overrides printed value)
   → Example: "10" written next to item = order 10 units
   → These are integers: 1, 5, 10, 25, etc.

2. CROSSED OUT / STRIKETHROUGH
   → Manager does NOT want this item (plenty in stock)
   → SKIP entirely — do not include in output

3. NO ANNOTATION
   → Manager wants the printed Quantity column value
   → This represents what sold last week = what to reorder

═══════════════════════════════════════════════════════════════════════════════
CRITICAL: DECIMAL QUANTITY FORMAT
═══════════════════════════════════════════════════════════════════════════════

The printed Quantity column uses DECIMAL NOTATION:

   PRINTED     ACTUAL MEANING     OUTPUT
   ───────     ──────────────     ──────
   1.000       ONE unit           1
   6.000       SIX units          6
   12.000      TWELVE units       12
   9.458       ~NINE units        9
   0.500       ~ONE unit          1
   25.910      ~TWENTY-SIX        26

THE PERIOD IS A DECIMAL POINT, NOT A THOUSANDS SEPARATOR.
- "1.000" = 1 (one), NOT 1000 (one thousand)
- "1,000" = 1000 (if you see commas, that's thousands)

ALWAYS round to the nearest INTEGER for output.

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT LAYOUT
═══════════════════════════════════════════════════════════════════════════════

SUPPLIER HEADERS appear as section dividers:
- "gum tree GOOD FOOD" (top of document)
- "CALENDAR CHEESE - S EMail" (mid-document)
- "DARIKAY - Box of 4 EMail 12 box min" (another section)

Clean supplier names by removing suffixes:
- " - S EMail" → remove
- " - Box of 4 EMail" → remove  
- " - 12 box min" → remove
- "EMail" or "Email" at end → remove

COLUMN LAYOUT (left to right):
┌────────────┬───────┬─────────────────────┬───────┬───────┬──────────┬─────┐
│ MARGIN     │ SKU   │ Product Name        │ Price │ Tax   │ Quantity │ ... │
│ (handwritten)│(5-digit)│                  │       │       │ (decimal)│     │
└────────────┴───────┴─────────────────────┴───────┴───────┴──────────┴─────┘

Example rows:
  10   14001  Meredith - Chevre Plain    8.49   0.00    1.000    ...
  ↑                                                     ↑
  Handwritten "10"                               Printed "1.000"
  USE: 10                                        (ignored - handwritten exists)

       14002  Meredith - Chevre Ash      8.49   0.00    6.000    ...
                                                        ↑
       No handwritten annotation                 USE: 6 (from printed)

  ̶1̶4̶0̶7̶8̶ ̶ ̶M̶e̶r̶e̶d̶i̶t̶h̶ ̶-̶ ̶G̶o̶a̶t̶ ̶C̶u̶r̶d̶ ̶1̶0̶0̶g̶    ...
  ↑
  Crossed out = SKIP ENTIRELY

═══════════════════════════════════════════════════════════════════════════════
WHAT TO IGNORE
═══════════════════════════════════════════════════════════════════════════════

- SKU codes (5-digit numbers like 14001, 24931) — NOT quantities
- Price columns (Unit Price Inc, Nett, Tax, Sales, Gross Inc, etc.)
- Totals, subtotals, page headers, dates
- Asterisks before product names (*Delice → Delice)
- Any row that is crossed out / struck through

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

{
  "items": [
    {"supplier": "gum tree GOOD FOOD", "product": "Meredith - Chevre Plain", "quantity": 10},
    {"supplier": "gum tree GOOD FOOD", "product": "Meredith - Chevre Ash", "quantity": 6},
    {"supplier": "CALENDAR CHEESE", "product": "Delice de Bourgogne", "quantity": 2}
  ]
}

REQUIREMENTS:
- "supplier": Cleaned name (no email suffixes)
- "product": Full name (no SKU, no asterisks)
- "quantity": INTEGER only (round decimals, handwritten override if present)

═══════════════════════════════════════════════════════════════════════════════
VALIDATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before returning, verify:
☐ No quantity is greater than 500 (likely a parsing error if so)
☐ No quantity equals a 5-digit SKU (14001 is not a quantity)
☐ Decimals like "1.000" parsed as 1, not 1000
☐ Crossed-out items are excluded
☐ Supplier names have no "EMail" suffix

Return ONLY valid JSON. No markdown code fences. No explanations.`;
}