/**
 * Parse document worker entry point
 * Handles file upload, validation, and routing
 */

import { handleCorsPreflight, withCors } from "../shared/utils/cors";
import { createError, sanitizeError } from "../shared/utils/errors";
import { handleParseDoc, handleParseImages, type Env } from "./handler";

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
      try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return handleCorsPreflight();
      }

      // Only allow POST
        if (request.method !== "POST") {
        const { response } = createError("Method not allowed", 405);
        return withCors(response);
        }
  
      // Check content type
        const contentType = request.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
        const { response } = createError("Expected multipart/form-data", 400);
        return withCors(response);
        }
  
      // Parse form data
      let formData: FormData;
      try {
        formData = await request.formData();
      } catch (err) {
        const { response } = createError("Invalid form data", 400);
        return withCors(response);
      }

      // Get request type (pdf or images)
      let type = formData.get("type") as string | null;
      console.log("[parse-doc:index] Request type:", type, typeof type);

      // Fallback: If type is not provided but file exists, assume PDF (backwards compatibility)
      if (!type) {
        const file = formData.get("file") as File | null;
        if (file) {
          console.log("[parse-doc:index] Type not provided, but file exists. Defaulting to 'pdf'");
          type = "pdf";
        }
      }

      // Debug: Log all form data keys
      const formDataKeys: string[] = [];
      for (const key of formData.keys()) {
        formDataKeys.push(key);
      }
      console.log("[parse-doc:index] Form data keys:", formDataKeys);

      if (type === "pdf") {
        // Handle PDF file upload
        const file = formData.get("file") as File | null;
        if (!file) {
          const { response } = createError("No file uploaded", 400);
          return withCors(response);
        }
        const response = await handleParseDoc(file, env);
        return withCors(response);
      } else if (type === "images") {
        // Handle pre-converted images from client
        const images: File[] = [];
        for (const [key, value] of formData.entries()) {
          if (key === "images" && value instanceof File) {
            console.log(`[parse-doc:index] Found image: ${value.name} (${value.size} bytes, ${value.type})`);
            images.push(value);
          }
        }
        
        console.log(`[parse-doc:index] Total images collected: ${images.length}`);
        
        if (images.length === 0) {
          const { response } = createError("No images uploaded", 400);
          return withCors(response);
        }
        
        const response = await handleParseImages(images, env);
        return withCors(response);
      } else {
        // Type not recognized
        const { response } = createError("Invalid type. Expected 'pdf' or 'images'", 400);
        return withCors(response);
      }
    } catch (err) {
        console.error("parse-doc error:", err);
      const errorMessage = sanitizeError(err);
      const { response } = createError("Unexpected server error", 500);
      return withCors(response);
  }
  },
};
  