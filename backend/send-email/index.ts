/**
 * Send email worker entry point
 * Handles routing, CORS, and error formatting
 */

import { handleCorsPreflight, withCors, corsJson } from "../shared/utils/cors";
import { createError, sanitizeError } from "../shared/utils/errors";
import { handleSendEmail, type Env } from "./handler";

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

      // Parse JSON body
      let body: any;
      try {
        body = await request.json();
      } catch (err) {
        const { response } = createError("Invalid JSON payload", 400);
        return withCors(response);
      }

      // Handle request
      const response = await handleSendEmail(body, env);
      return withCors(response);
    } catch (err) {
      console.error("send-email error:", err);
      const errorMessage = sanitizeError(err);
      const { response } = createError("Unexpected server error", 500);
      return withCors(response);
    }
  },
};
