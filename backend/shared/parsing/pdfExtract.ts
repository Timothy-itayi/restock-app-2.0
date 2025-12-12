/**
 * PDF text extraction stub
 * 
 * PDF.js doesn't work in Cloudflare Workers due to:
 * - No Canvas API for rendering
 * - WASM/Web Worker limitations
 * 
 * All PDFs are handled via the vision API route.
 * This stub returns null to trigger vision API fallback.
 */

/**
 * Stub: Always returns null to trigger vision API fallback
 * PDF text extraction is not supported in Cloudflare Workers
 * 
 * @param buffer - PDF file as ArrayBuffer
 * @returns Always null (triggers vision API)
 */
export async function extractPdfText(
  buffer: ArrayBuffer
): Promise<{ text: string } | null> {
  console.log("[pdfExtract] PDF text extraction not available in Workers, using vision API");
  return null;
}

/**
 * Stub: Always returns false
 * PDF text layer detection is not supported in Cloudflare Workers
 * 
 * @param buffer - PDF file as ArrayBuffer
 * @returns Always false
 */
export async function hasTextLayer(buffer: ArrayBuffer): Promise<boolean> {
  return false;
}

/**
 * @deprecated DO NOT USE IN CLOUDFLARE WORKERS
 * 
 * PDF-to-image conversion must happen on the client (Expo app)
 * where native device APIs are available.
 */
export async function renderPdfPagesToImages(
  buffer: ArrayBuffer,
  scale: number = 2.0,
  maxPages: number = 10
): Promise<string[]> {
  throw new Error(
    "PDF rendering is not supported in Cloudflare Workers. " +
    "Convert scanned PDFs to JPEG images client-side and send them with type='images'."
  );
}
