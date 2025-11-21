/**
 * Parse document handler
 * Handles PDF parsing pipeline: text extraction → block parsing → LLM → validation
 */

import { extractPdfText } from "../shared/parsing/pdfExtract";
import { parseSupplierBlocks, createFallbackBlock } from "../shared/parsing/blockParser";
import { buildExtractionPrompt, buildVisionPrompt } from "../shared/parsing/llmPrompt";
import { groqChat, groqVision, imageToBase64DataUrl } from "../shared/clients/groq";
import { validateParsedDoc } from "../shared/validation/parsedDoc";
import { normalizeSupplier, normalizeProduct } from "../shared/utils/normalize";
import { createError, createSuccess } from "../shared/utils/errors";

export interface Env {
  GROQ_API_KEY: string;
  PARSE_DEBUG?: KVNamespace;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const GROQ_MODEL = "llama-3.1-70b-versatile"; // Or "mixtral-8x7b-32768" for structured JSON

/**
 * Handles document parsing request
 */
export async function handleParseDoc(
  file: File,
  env: Env
): Promise<Response> {
  // Validate file
  if (file.size > MAX_FILE_SIZE) {
    const { response } = createError("File too large (limit 10 MB)", 413);
    return response;
  }

  const mimeType = file.type || "application/pdf";
  if (!mimeType.includes("pdf") && !mimeType.startsWith("image/")) {
    const { response } = createError("Only PDF and image files are supported", 400);
    return response;
  }

  try {
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();

    let items: Array<{ supplier?: string; product: string; quantity?: number }> = [];

    // Route based on file type
    const isPdf = mimeType.includes("pdf");
    const isImage = mimeType.startsWith("image/");

    if (isPdf) {
      // PDF: Extract text → Send to Groq Chat API
      const textResult = await extractPdfText(arrayBuffer);

      if (!textResult || !textResult.text) {
        const { response } = createError(
          "Could not extract text from PDF. The PDF may be scanned or corrupted. Please ensure the PDF has a text layer.",
          400
        );
        return response;
      }

      // Parse text into supplier blocks
      const blocks = parseSupplierBlocks(textResult.text);
      const blocksToProcess = blocks.length > 0 ? blocks : [createFallbackBlock(textResult.text)];

      // Build prompt and send to Groq Chat API
      const prompt = buildExtractionPrompt(blocksToProcess);
      const llmResponse = await groqChat(
        {
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          model: GROQ_MODEL,
          temperature: 0.1,
          response_format: { type: "json_object" },
        },
        env.GROQ_API_KEY
      );

      if (!llmResponse.ok) {
        const { response } = createError(
          llmResponse.error || "Failed to parse document with LLM",
          500
        );
        return response;
      }

      // Parse and validate LLM response
      try {
        const parsed = JSON.parse(llmResponse.content!);
        const validated = validateParsedDoc(parsed);
        items = validated.items;
      } catch (parseErr) {
        console.error("Failed to parse LLM JSON:", parseErr);
        const { response } = createError("Invalid response from parsing service", 500);
        return response;
      }
    } else if (isImage) {
      // Image: Send directly to Groq Vision API
      const base64DataUrl = imageToBase64DataUrl(arrayBuffer, mimeType);
      const visionResponse = await groqVision(
        {
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: base64DataUrl },
                },
                {
                  type: "text",
                  text: buildVisionPrompt(),
                },
              ],
            },
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct", // Groq vision model
          temperature: 0.1,
          response_format: { type: "json_object" },
        },
        env.GROQ_API_KEY
      );

      if (!visionResponse.ok) {
        const { response } = createError(
          visionResponse.error || "Failed to parse image",
          500
        );
        return response;
      }

      // Parse and validate vision response
      try {
        const parsed = JSON.parse(visionResponse.content!);
        const validated = validateParsedDoc(parsed);
        items = validated.items;
      } catch (parseErr) {
        console.error("Failed to parse vision JSON:", parseErr);
        const { response } = createError("Invalid response from parsing service", 500);
        return response;
      }
    } else {
      // Should not reach here due to validation above, but handle anyway
      const { response } = createError("Unsupported file type", 400);
      return response;
    }

    // Step 6: Normalize items
    const normalizedItems = items
      .map((item, idx) => {
        const product = normalizeProduct(item.product);
        if (!product) return null;

        return {
          id: `parsed-${Date.now()}-${idx}`,
          supplier: item.supplier ? normalizeSupplier(item.supplier) : "",
          product,
          quantity: item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Step 7: Return results
    // Frontend expects { items: [...] } format, not wrapped in success
    return new Response(
      JSON.stringify({ items: normalizedItems }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("parse-doc handler error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unexpected error";
    const { response } = createError(errorMessage, 500);
    return response;
  }
}

