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

DOCUMENT CONTEXT:
This may be a printed stock report that has been ANNOTATED BY HAND. Managers print these reports and:
- Write handwritten numbers on the LEFT side next to items they need to restock
- Cross out items they do NOT need
- The printed columns (Quantity, Nett, Sales, etc.) are HISTORICAL SALES DATA

QUANTITY EXTRACTION PRIORITY:
1. FIRST: Look for numbers appearing BEFORE the product code/name - these are handwritten annotations
   - If present, this IS the quantity to use - it OVERRIDES any printed quantity column
2. SECOND: If no number appears before the item, use the printed "Quantity" column value
3. SKIP: Any item that appears crossed out or struck through

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
- Numbers BEFORE item names take priority as quantity (handwritten annotations)
- Otherwise use the printed quantity column
- SKU codes (4-6 digit numbers as part of product names) are NOT quantities
- Skip crossed-out or struck-through items entirely
- Return empty array if no items found`;
}

/**
 * Creates a vision API prompt for scanned PDFs
 * Uses the specific prompt format for product list extraction
 */
export function buildVisionPrompt(): string {
  return `You are extracting restock items from a "Stock Item Sales Report" image.

═══════════════════════════════════════════════════════════════════════════════
DOCUMENT LAYOUT - 3 KEY AREAS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ AREA 1: SUPPLIER HEADERS (section dividers)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   "gum tree GOOD FOOD"           ← Top of document, main supplier           │
│   "CALENDAR CHEESE - S EMail"    ← Section header for cheese items          │
│   "DARIKAY - Box of 4 EMail"     ← Another supplier section                 │
│                                                                             │
│   These headers indicate which supplier the following items belong to.      │
│   Strip suffixes like " - S EMail", " - Box EMail" from supplier name.      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AREA 2: PRODUCT ROWS - This is where data is extracted                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   [MARGIN]  [SKU]   [Product Name]        [Price] [Qty] [Sales...]          │
│      ↓        ↓           ↓                  ↓      ↓                       │
│      10    14001  Meredith - Chevre Plain  8.49   6.000   ...               │
│      ↑                                            ↑                         │
│      │                                            │                         │
│   HANDWRITTEN                              PRINTED (ignore if               │
│   = USE THIS!                              handwritten exists)              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ AREA 3: CROSSED-OUT ITEMS - DO NOT INCLUDE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ̶1̶4̶0̶7̶8̶ ̶ ̶M̶e̶r̶e̶d̶i̶t̶h̶ ̶-̶ ̶G̶o̶a̶t̶ ̶C̶u̶r̶d̶ ̶1̶0̶0̶g̶     ← Line through = SKIP             │
│   ̶1̶4̶0̶8̶0̶ ̶ ̶M̶e̶r̶e̶d̶i̶t̶h̶ ̶-̶ ̶M̶a̶r̶i̶n̶a̶t̶e̶d̶ ̶F̶e̶t̶a̶       ← Line through = SKIP             │
│                                                                             │
│   Any item with strikethrough/crossed-out = manager doesn't need it         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
QUANTITY RULES - READ CAREFULLY
═══════════════════════════════════════════════════════════════════════════════

EXAMPLE ROW:
┌──────────┬───────┬─────────────────────────┬───────┬───────┬─────────┐
│  MARGIN  │  SKU  │     Product Name        │ Price │  Qty  │ Sales...│
├──────────┼───────┼─────────────────────────┼───────┼───────┼─────────┤
│    10    │ 14001 │ Meredith - Chevre Plain │ 8.49  │ 6.000 │   ...   │
└──────────┴───────┴─────────────────────────┴───────┴───────┴─────────┘
     ↑                                               ↑
     │                                               │
  HANDWRITTEN "10"                          PRINTED "6" (historical)
  in left margin                            IGNORE THIS!
     │
     └──────────────────────────────────────────────────────────────────┐
                                                                        │
OUTPUT: {"supplier": "gum tree GOOD FOOD", "product": "Meredith - Chevre Plain", "quantity": 10}
                                                                   USE 10! ↑

RULE 1: Handwritten number in LEFT MARGIN = THE QUANTITY TO USE
        - Appears BEFORE the 5-digit SKU code
        - Usually 1-2 digits, sometimes circled
        - This OVERRIDES the printed Qty column

RULE 2: No handwritten number? → Use printed Qty column as fallback

RULE 3: Item crossed out? → DO NOT INCLUDE in output

═══════════════════════════════════════════════════════════════════════════════
COMPLETE EXAMPLE
═══════════════════════════════════════════════════════════════════════════════

INPUT (what you see):
┌────────────────────────────────────────────────────────────────────────────┐
│ gum tree GOOD FOOD                                                         │
│                                                                            │
│  10  14001  Meredith - Chevre Plain     8.49   6.000    ...                │
│       14002  Meredith - Chevre Ash      8.49   1.000    ...                │
│   5  18115  Meredith - Ewes Yog Blue    7.49   4.000    ...                │
│  ̶1̶8̶1̶0̶2̶ ̶ ̶M̶e̶r̶e̶d̶i̶t̶h̶ ̶-̶ ̶E̶w̶e̶s̶ ̶Y̶o̶g̶ ̶G̶r̶n̶                                           │
│                                                                            │
│ CALENDAR CHEESE - S EMail                                                  │
│                                                                            │
│   3  14156  Delice de Bourgogne        99.50   1.590    ...                │
│      14154  Fromager d'Affinois        79.50   9.458    ...                │
└────────────────────────────────────────────────────────────────────────────┘

OUTPUT (what you return):
{
  "items": [
    {"supplier": "gum tree GOOD FOOD", "product": "Meredith - Chevre Plain", "quantity": 10},
    {"supplier": "gum tree GOOD FOOD", "product": "Meredith - Chevre Ash", "quantity": 1},
    {"supplier": "gum tree GOOD FOOD", "product": "Meredith - Ewes Yog Blue", "quantity": 5},
    {"supplier": "CALENDAR CHEESE", "product": "Delice de Bourgogne", "quantity": 3},
    {"supplier": "CALENDAR CHEESE", "product": "Fromager d'Affinois", "quantity": 9}
  ]
}

NOTE: 
- "Meredith - Chevre Plain" → qty=10 (handwritten), NOT 6 (printed)
- "Meredith - Ewes Yog Grn" → SKIPPED (crossed out)
- "Fromager d'Affinois" → qty=9 (from printed Qty column, rounded)

═══════════════════════════════════════════════════════════════════════════════

Return ONLY valid JSON. No markdown, no explanation, no extra text.`;
}

