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

// Image formats supported by Groq Vision API
const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Formats that need client-side conversion (not supported by Vision API)
const UNSUPPORTED_IMAGE_FORMATS = [
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  'image/bmp',
  'image/tiff',
];

/**
 * Validates if an image format is supported by the Vision API
 */
function isImageFormatSupported(mimeType: string): boolean {
  return SUPPORTED_IMAGE_FORMATS.includes(mimeType.toLowerCase());
}

/**
 * Gets a user-friendly error message for unsupported formats
 */
function getFormatErrorMessage(mimeType: string, fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'heic' || ext === 'heif' || mimeType.includes('heic') || mimeType.includes('heif')) {
    return 'HEIC format not supported. Please convert to JPEG or take a new photo with your camera app.';
  }
  
  if (ext === 'bmp' || mimeType.includes('bmp')) {
    return 'BMP format not supported. Please use JPEG or PNG instead.';
  }
  
  if (ext === 'tiff' || ext === 'tif' || mimeType.includes('tiff')) {
    return 'TIFF format not supported. Please use JPEG or PNG instead.';
  }
  
  return `Image format "${mimeType}" not supported. Please use JPEG, PNG, GIF, or WebP.`;
}

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
        // Scanned PDF (no text layer): Client should have converted to images
        // If we receive a PDF with no text, return error asking client to convert
        console.log(`[parse-doc:handler] PDF has no text layer`);
        console.log(`[parse-doc:handler] This PDF appears to be scanned. Client should convert to images first.`);
        const { response } = createError(
          "PDF appears to be scanned. Please convert to images first.",
          400,
          "NO_TEXT_FOUND"
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
      // Validate image format before sending to Vision API
      if (!isImageFormatSupported(mimeType)) {
        console.log(`[parse-doc:handler] Unsupported image format: ${mimeType} (${file.name})`);
        const { response } = createError(
          getFormatErrorMessage(mimeType, file.name),
          400,
          "UNSUPPORTED_FORMAT"
        );
        return response;
      }

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
          model: "meta-llama/llama-4-scout-17b-16e-instruct", // Groq Llama 4 Scout vision model
          temperature: 0.1,
          max_tokens: 4096, // Ensure enough tokens for large product lists
          response_format: { type: "json_object" },
        },
        env.GROQ_API_KEY
      );

      console.log(`[parse-doc:handler] Vision API response ok: ${visionResponse.ok}`);
      if (visionResponse.content) {
        console.log(`[parse-doc:handler] Vision response preview: ${visionResponse.content.substring(0, 500)}`);
      }
      if (visionResponse.error) {
        console.error(`[parse-doc:handler] Vision API error: ${visionResponse.error}`);
      }

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
        console.log(`[parse-doc:handler] Parsed items count: ${parsed.items?.length || 0}`);
        
        // Check if LLM indicated this is not a product list
        if (parsed.error === 'not_product_list') {
          console.log(`[parse-doc:handler] LLM detected non-product image`);
          const { response } = createError(
            "This image doesn't appear to be a product list. Please upload an image of an inventory list, order form, or stock report.",
            400,
            "NOT_PRODUCT_LIST"
          );
          return response;
        }
        
        const validated = validateParsedDoc(parsed);
        items = validated.items;
      } catch (parseErr) {
        console.error("Failed to parse vision JSON:", parseErr);
        console.error("Raw content:", visionResponse.content);
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

/**
 * Handles parsing of pre-converted images from client (for scanned PDFs)
 * Client converts PDF pages to JPEG images before uploading
 */
export async function handleParseImages(
  images: File[],
  env: Env
): Promise<Response> {
  // Validate images
  const MAX_IMAGES = 10;
  if (images.length > MAX_IMAGES) {
    const { response } = createError(`Too many images (limit ${MAX_IMAGES})`, 400);
    return response;
  }

  const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB total
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    const { response } = createError("Total image size too large (limit 10 MB)", 413);
    return response;
  }

  // Validate all files are images AND in supported formats
  for (const image of images) {
    const mimeType = image.type || "";
    if (!mimeType.startsWith("image/")) {
      const { response } = createError("All files must be images", 400);
      return response;
    }
    
    // Check if format is supported by Vision API
    if (!isImageFormatSupported(mimeType)) {
      console.log(`[parse-doc:handler] Unsupported image format in batch: ${mimeType} (${image.name})`);
      const { response } = createError(
        getFormatErrorMessage(mimeType, image.name),
        400,
        "UNSUPPORTED_FORMAT"
      );
      return response;
    }
  }

  try {
    // Process all images and collect items
    let allItems: Array<{ supplier?: string; product: string; quantity?: number }> = [];
    
    console.log(`[parse-doc:handler] Processing ${images.length} image(s)`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`[parse-doc:handler] Processing image ${i + 1}/${images.length}: ${image.name} (${image.size} bytes, ${image.type})`);
      
      const arrayBuffer = await image.arrayBuffer();
      const mimeType = image.type || "image/jpeg";
      const base64DataUrl = imageToBase64DataUrl(arrayBuffer, mimeType);
      
      console.log(`[parse-doc:handler] Image ${i + 1} converted to base64 (${base64DataUrl.length} chars)`);

      // Send to Groq Vision API
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
          model: "meta-llama/llama-4-scout-17b-16e-instruct", // Groq Llama 4 Scout vision model
          temperature: 0.1,
          max_tokens: 4096, // Ensure enough tokens for large product lists
          response_format: { type: "json_object" },
        },
        env.GROQ_API_KEY
      );

      console.log(`[parse-doc:handler] Image ${i + 1} vision response ok: ${visionResponse.ok}`);
      if (visionResponse.error) {
        console.error(`[parse-doc:handler] Image ${i + 1} API error: ${visionResponse.error}`);
      }

      if (!visionResponse.ok) {
        console.error(`Failed to parse image ${i + 1}/${images.length} (${image.name}):`, visionResponse.error);
        // Continue with other images instead of failing completely
        continue;
      }

      // Log raw response for debugging
      console.log(`[parse-doc:handler] Image ${i + 1} raw response:`, visionResponse.content?.substring(0, 500));

      // Parse and validate vision response
      try {
        const parsed = JSON.parse(visionResponse.content!);
        console.log(`[parse-doc:handler] Image ${i + 1} parsed JSON:`, JSON.stringify(parsed).substring(0, 300));
        
        // Check if LLM indicated this is not a product list
        if (parsed.error === 'not_product_list') {
          console.log(`[parse-doc:handler] Image ${i + 1} is not a product list`);
          // If this is the only image and it's not a product list, return error
          if (images.length === 1) {
            const { response } = createError(
              "This image doesn't appear to be a product list. Please upload an image of an inventory list, order form, or stock report.",
              400,
              "NOT_PRODUCT_LIST"
            );
            return response;
          }
          // If multiple images, skip this one and continue
          continue;
        }
        
        const validated = validateParsedDoc(parsed);
        console.log(`[parse-doc:handler] Image ${i + 1} validated items: ${validated.items.length}`);
        allItems.push(...validated.items);
      } catch (parseErr) {
        console.error(`Failed to parse vision JSON for ${image.name}:`, parseErr);
        // Continue with other images
        continue;
      }
    }
    
    console.log(`[parse-doc:handler] Total items extracted: ${allItems.length}`);

    if (allItems.length === 0) {
      const { response } = createError(
        "This image doesn't appear to be a product list. Please upload an image of an inventory list, order form, or stock report.",
        400,
        "NOT_PRODUCT_LIST"
      );
      return response;
    }

    // Normalize items
    const normalizedItems = allItems
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

    // Check if we have any valid items after normalization
    if (normalizedItems.length === 0) {
      const { response } = createError(
        "This image doesn't appear to be a product list. Please upload an image of an inventory list, order form, or stock report.",
        400,
        "NOT_PRODUCT_LIST"
      );
      return response;
    }

    // Return results
    return new Response(
      JSON.stringify({ items: normalizedItems }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("parse-images handler error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unexpected error";
    const { response } = createError(errorMessage, 500);
    return response;
  }
}

