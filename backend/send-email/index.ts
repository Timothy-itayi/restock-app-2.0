/**
 * Send email worker entry point
 * Handles routing, CORS, and error formatting
 */

import { handleCorsPreflight, withCors, corsJson } from "../shared/utils/cors";
import { createError, sanitizeError } from "../shared/utils/errors";
import { handleSendEmail, type Env } from "./handler";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();
    console.log(`[send-email:${requestId}] Incoming request:`, {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
    });
    
    try {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        console.log(`[send-email:${requestId}] Handling CORS preflight`);
        return handleCorsPreflight();
      }

      // Only allow POST
      if (request.method !== "POST") {
        console.error(`[send-email:${requestId}] Invalid method: ${request.method}`);
        const { response } = createError("Method not allowed", 405);
        return withCors(response);
      }

      // Parse JSON body
      let body: any;
      try {
        const bodyText = await request.text();
        console.log(`[send-email:${requestId}] Request body (first 500 chars):`, bodyText.substring(0, 500));
        body = JSON.parse(bodyText);
        console.log(`[send-email:${requestId}] Parsed body:`, {
          to: body.to,
          supplierEmail: body.supplierEmail,
          replyTo: body.replyTo,
          subject: body.subject,
          bodyLength: body.body?.length || body.text?.length,
          itemsCount: body.items?.length || 0,
          storeName: body.storeName,
        });
      } catch (err) {
        console.error(`[send-email:${requestId}] Failed to parse JSON:`, err);
        const { response } = createError("Invalid JSON payload", 400);
        return withCors(response);
      }

      // Check environment variables
      console.log(`[send-email:${requestId}] Environment check:`, {
        hasResendApiKey: !!env.RESEND_API_KEY,
        emailFromAddress: env.EMAIL_FROM_ADDRESS,
        emailProviderUrl: env.EMAIL_PROVIDER_URL,
      });

      // Handle request
      console.log(`[send-email:${requestId}] Calling handleSendEmail`);
      const response = await handleSendEmail(body, env);
      const responseText = await response.clone().text();
      console.log(`[send-email:${requestId}] Handler response:`, {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 500),
      });
      return withCors(response);
    } catch (err) {
      console.error(`[send-email:${requestId}] Unexpected error:`, err);
      console.error(`[send-email:${requestId}] Error details:`, {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      const errorMessage = sanitizeError(err);
      const { response } = createError("Unexpected server error", 500);
      return withCors(response);
    }
  },
};
