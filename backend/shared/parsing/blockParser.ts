/**
 * Converts extracted text into supplier-scoped blocks
 * Identifies header lines vs body lines
 */

export interface SupplierBlock {
  supplierName: string;
  lines: string[];
}

/**
 * Parses text into supplier blocks
 * Looks for supplier headers and groups subsequent lines
 */
export function parseSupplierBlocks(text: string): SupplierBlock[] {
  if (!text || typeof text !== "string") {
    return [];
  }

  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const blocks: SupplierBlock[] = [];
  let currentBlock: SupplierBlock | null = null;

  for (const line of lines) {
    // Heuristic: lines that look like supplier headers
    // - All caps
    // - Contains "SUPPLIER", "VENDOR", "FROM"
    // - Standalone on a line with minimal punctuation
    const isHeader = isSupplierHeader(line);

    if (isHeader) {
      // Save previous block if exists
      if (currentBlock && currentBlock.lines.length > 0) {
        blocks.push(currentBlock);
      }
      // Start new block
      currentBlock = {
        supplierName: normalizeHeader(line),
        lines: [],
      };
    } else if (currentBlock) {
      // Add line to current block
      currentBlock.lines.push(line);
    } else {
      // No current block, might be a standalone header
      if (isHeader) {
        currentBlock = {
          supplierName: normalizeHeader(line),
          lines: [],
        };
      }
      // Otherwise, ignore orphaned lines (they'll be handled by LLM)
    }
  }

  // Add final block
  if (currentBlock && currentBlock.lines.length > 0) {
    blocks.push(currentBlock);
  }

  return blocks;
}

/**
 * Heuristic to detect supplier header lines
 */
function isSupplierHeader(line: string): boolean {
  const upper = line.toUpperCase();
  
  // Check for common supplier header patterns
  const headerPatterns = [
    /^SUPPLIER[:]?\s*/i,
    /^VENDOR[:]?\s*/i,
    /^FROM[:]?\s*/i,
    /^ORDER\s+FROM[:]?\s*/i,
  ];

  if (headerPatterns.some((pattern) => pattern.test(line))) {
    return true;
  }

  // Check if line is mostly uppercase and short (likely a header)
  if (line.length < 50 && upper === line && line.length > 3) {
    return true;
  }

  return false;
}

/**
 * Normalizes header text to extract supplier name
 */
function normalizeHeader(header: string): string {
  return header
    .replace(/^(SUPPLIER|VENDOR|FROM|ORDER\s+FROM)[:]?\s*/i, "")
    .trim();
}

/**
 * If no blocks found, create a single block with all text
 * This allows LLM to infer suppliers from context
 */
export function createFallbackBlock(text: string): SupplierBlock {
  const lines = text
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return {
    supplierName: "",
    lines,
  };
}

