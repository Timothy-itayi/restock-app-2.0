/**
 * Parse document worker entry point
 * Handles file upload, validation, and routing
 */

import { handleCorsPreflight, withCors } from "../shared/utils/cors";
import { createError, sanitizeError } from "../shared/utils/errors";
import { handleParseDoc, type Env } from "./handler";

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

      // Get file
      const file = formData.get("file") as File | null;
      if (!file) {
        const { response } = createError("No file uploaded", 400);
        return withCors(response);
        }
  
      // Handle parsing
      const response = await handleParseDoc(file, env);
      return withCors(response);
    } catch (err) {
        console.error("parse-doc error:", err);
      const errorMessage = sanitizeError(err);
      const { response } = createError("Unexpected server error", 500);
      return withCors(response);
  }
  },
};
  