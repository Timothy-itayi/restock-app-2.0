/**
 * PDF text extraction using PDF.js
 * Extracts text from PDF files for text-based documents
 * Returns null for scanned PDFs (no text layer) to trigger vision API fallback
 */

// Import PDF.js - standard import (requires node_compat in wrangler.toml)
// @ts-ignore - PDF.js types may not be perfect for Workers environment
import * as pdfjsLib from "pdfjs-dist";

/**
 * Attempts to extract text from PDF buffer
 * Returns extracted text or null if text layer is unavailable (scanned PDF)
 * 
 * @param buffer - PDF file as ArrayBuffer
 * @returns Object with text string, or null if extraction fails
 */
export async function extractPdfText(
  buffer: ArrayBuffer
): Promise<{ text: string } | null> {
  try {
    // Load PDF document
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      // Disable font loading to reduce overhead in Workers
      disableFontFace: true,
      verbosity: 0, // Suppress warnings
      // Disable CMap loading (not needed for text extraction)
      useSystemFonts: false,
    }).promise;

    let fullText = "";

    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Build text preserving structure
      let pageText = "";
      let lastY = -1;

      for (const item of textContent.items) {
        if ("str" in item && item.str) {
          // Check if we need a newline (different Y position indicates new line)
          const currentY = (item as any).transform?.[5] || 0;
          if (lastY !== -1 && Math.abs(currentY - lastY) > 2) {
            pageText += "\n";
          }
          
          pageText += item.str;
          lastY = currentY;
        }
      }

      if (pageText.trim()) {
        fullText += pageText.trim() + "\n\n";
      }
    }

    // Return text if we extracted any, otherwise null (scanned PDF)
    return fullText.trim() ? { text: fullText.trim() } : null;
  } catch (err) {
    console.warn("PDF text extraction failed:", err);
    // Return null to trigger vision API fallback
    return null;
  }
}

/**
 * Checks if PDF has extractable text layer
 * Quick check before attempting full extraction
 * 
 * @param buffer - PDF file as ArrayBuffer
 * @returns true if PDF likely has text layer
 */
export async function hasTextLayer(buffer: ArrayBuffer): Promise<boolean> {
  try {
    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableFontFace: true,
      verbosity: 0,
    }).promise;

    // Quick check: try to get text from first page
    if (pdf.numPages > 0) {
      const firstPage = await pdf.getPage(1);
      const textContent = await firstPage.getTextContent();
      
      // Check if we have any text items
      return textContent.items.some((item) => "str" in item && item.str?.trim());
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * @deprecated DO NOT USE IN CLOUDFLARE WORKERS
 * 
 * This function attempts to render PDF pages to JPEG images, but it fundamentally
 * cannot work in Cloudflare Workers because:
 * 
 * 1. **No Canvas API**: Workers don't support Canvas rendering
 * 2. **No Web Workers**: PDF.js threading requires Web Workers (not available)
 * 3. **WASM limitations**: PDFium WASM requires features not available in Workers
 * 4. **No native modules**: node-canvas, sharp, etc. don't work in Workers
 * 
 * **Architecture Solution**: PDF-to-image conversion must happen on the client (Expo app)
 * where native device APIs are available. The client should convert scanned PDFs to
 * JPEG images and send them to the Worker with type="images".
 * 
 * This function is kept for reference only and will always throw an error.
 */
export async function renderPdfPagesToImages(
  buffer: ArrayBuffer,
  scale: number = 2.0,
  maxPages: number = 10
): Promise<string[]> {
  // This function cannot work in Cloudflare Workers - always throw
  throw new Error(
    "PDF rendering is not supported in Cloudflare Workers. " +
    "PDF-to-image conversion must be performed on the client (Expo app) using native device APIs. " +
    "Convert scanned PDFs to JPEG images client-side and send them with type='images'."
  );
}
