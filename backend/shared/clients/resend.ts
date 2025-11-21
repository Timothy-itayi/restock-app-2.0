/**
 * Resend API client wrapper
 * Handles retries with exponential backoff
 */

export interface ResendPayload {
  from: string;
  to: string | string[];
  reply_to?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface ResendResponse {
  ok: boolean;
  status: number;
  json?: any;
  error?: string;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

/**
 * Sends email via Resend API with retry logic
 */
export async function sendViaResend(
  payload: ResendPayload,
  apiKey: string,
  apiUrl: string = "https://api.resend.com/emails"
): Promise<ResendResponse> {
  console.log('[sendViaResend] Starting Resend API call');
  console.log('[sendViaResend] Payload:', {
    from: payload.from,
    to: payload.to,
    replyTo: payload.reply_to,
    subject: payload.subject,
    htmlLength: payload.html?.length,
    textLength: payload.text?.length,
  });
  console.log('[sendViaResend] API URL:', apiUrl);
  console.log('[sendViaResend] Has API key:', !!apiKey, 'Key length:', apiKey?.length);
  
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    console.log(`[sendViaResend] Attempt ${attempt + 1}/${MAX_RETRIES}`);
    
    try {
      const requestBody = JSON.stringify(payload);
      console.log(`[sendViaResend] Request body length: ${requestBody.length}`);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: requestBody,
      });

      console.log(`[sendViaResend] Response status: ${response.status} ${response.statusText}`);
      console.log(`[sendViaResend] Response headers:`, Object.fromEntries(response.headers.entries()));

      const json = await response.json().catch((err) => {
        console.error('[sendViaResend] Failed to parse JSON response:', err);
        return {};
      });
      
      console.log(`[sendViaResend] Response JSON:`, json);

      if (response.ok) {
        console.log('[sendViaResend] Success! Message ID:', json.id);
        return {
          ok: true,
          status: response.status,
          json,
        };
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        console.error(`[sendViaResend] Client error (${response.status}), not retrying:`, json);
        return {
          ok: false,
          status: response.status,
          error: json.message || json.error || "Resend API error",
        };
      }

      // For 5xx errors, we'll retry
      console.warn(`[sendViaResend] Server error (${response.status}), will retry`);
      lastError = new Error(
        json.message || `Resend API returned ${response.status}`
      );
    } catch (err) {
      console.error(`[sendViaResend] Exception on attempt ${attempt + 1}:`, err);
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Exponential backoff: wait before retrying
    if (attempt < MAX_RETRIES - 1) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
      console.log(`[sendViaResend] Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.error('[sendViaResend] All retries exhausted. Last error:', lastError?.message);
  return {
    ok: false,
    status: 502,
    error: lastError?.message || "Resend API request failed after retries",
  };
}

