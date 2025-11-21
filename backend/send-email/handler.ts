/**
 * Send email handler
 * Validates request, formats email, and sends via Resend
 */

import { validateEmailRequest } from "../shared/validation/email";
import { formatEmailWithItems } from "../shared/utils/emailFormat";
import { sendViaResend } from "../shared/clients/resend";
import { createError, createSuccess } from "../shared/utils/errors";

export interface Env {
  RESEND_API_KEY: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_PROVIDER_URL?: string;
}

export interface SendEmailRequest {
  to?: string;
  supplierEmail?: string; // Legacy support
  replyTo?: string;
  subject: string;
  body: string;
  html?: string;
  items?: Array<{ productName: string; quantity: number }>;
  storeName?: string;
}

/**
 * Handles send email request
 */
export async function handleSendEmail(
  request: SendEmailRequest,
  env: Env
): Promise<Response> {
  // Validate request
  const validation = validateEmailRequest(request);
  if (!validation.ok) {
    const { response } = createError(validation.error, 400);
    return response;
  }

  const payload = validation.value;

  // 'to' field is guaranteed to be present after validation normalization
  const recipientEmail = payload.to;

  // Format email body
  const { text, html } = formatEmailWithItems(
    payload.body,
    payload.items || [],
    payload.storeName || "Restock App"
  );

  // Send via Resend
  const apiUrl = env.EMAIL_PROVIDER_URL || "https://api.resend.com/emails";
  const resendResponse = await sendViaResend(
    {
      from: env.EMAIL_FROM_ADDRESS,
      to: recipientEmail,
      reply_to: payload.replyTo,
      subject: payload.subject,
      html,
      text,
    },
    env.RESEND_API_KEY,
    apiUrl
  );

  if (!resendResponse.ok) {
    const { response } = createError(
      resendResponse.error || "Failed to send email",
      resendResponse.status >= 400 && resendResponse.status < 500 ? resendResponse.status : 502
    );
    return response;
  }

  // Return success
  return createSuccess(
    undefined,
    200,
    {
      messageId: resendResponse.json?.id || "unknown",
    }
  );
}

