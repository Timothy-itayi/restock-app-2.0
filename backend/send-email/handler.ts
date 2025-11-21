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
  console.log('[handleSendEmail] Starting email handler');
  console.log('[handleSendEmail] Request:', {
    to: request.to,
    supplierEmail: request.supplierEmail,
    replyTo: request.replyTo,
    subject: request.subject,
    bodyLength: request.body?.length || request.text?.length,
    itemsCount: request.items?.length || 0,
    storeName: request.storeName,
  });
  
  // Validate request
  console.log('[handleSendEmail] Validating request');
  const validation = validateEmailRequest(request);
  if (!validation.ok) {
    console.error('[handleSendEmail] Validation failed:', validation.error);
    const { response } = createError(validation.error, 400);
    return response;
  }

  const payload = validation.value;
  console.log('[handleSendEmail] Validation passed, normalized payload:', {
    to: payload.to,
    replyTo: payload.replyTo,
    subject: payload.subject,
    bodyLength: payload.body?.length,
    itemsCount: payload.items?.length || 0,
    storeName: payload.storeName,
  });

  // 'to' field is guaranteed to be present after validation normalization
  const recipientEmail = payload.to;
  console.log('[handleSendEmail] Recipient email:', recipientEmail);

  // Format email body
  console.log('[handleSendEmail] Formatting email body');
  const { text, html } = formatEmailWithItems(
    payload.body,
    payload.items || [],
    payload.storeName || "Restock App"
  );
  console.log('[handleSendEmail] Formatted email:', {
    textLength: text.length,
    htmlLength: html.length,
  });

  // Send via Resend
  const apiUrl = env.EMAIL_PROVIDER_URL || "https://api.resend.com/emails";
  console.log('[handleSendEmail] Sending via Resend:', {
    apiUrl,
    from: env.EMAIL_FROM_ADDRESS,
    to: recipientEmail,
    replyTo: payload.replyTo,
    subject: payload.subject,
    hasApiKey: !!env.RESEND_API_KEY,
  });
  
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

  console.log('[handleSendEmail] Resend response:', {
    ok: resendResponse.ok,
    status: resendResponse.status,
    error: resendResponse.error,
    messageId: resendResponse.json?.id,
  });

  if (!resendResponse.ok) {
    console.error('[handleSendEmail] Resend failed:', {
      status: resendResponse.status,
      error: resendResponse.error,
      json: resendResponse.json,
    });
    const { response } = createError(
      resendResponse.error || "Failed to send email",
      resendResponse.status >= 400 && resendResponse.status < 500 ? resendResponse.status : 502
    );
    return response;
  }

  // Return success
  console.log('[handleSendEmail] Email sent successfully, messageId:', resendResponse.json?.id);
  return createSuccess(
    undefined,
    200,
    {
      messageId: resendResponse.json?.id || "unknown",
    }
  );
}

