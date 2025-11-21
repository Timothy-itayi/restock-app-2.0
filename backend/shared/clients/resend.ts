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
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          json,
        };
      }

      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return {
          ok: false,
          status: response.status,
          error: json.message || json.error || "Resend API error",
        };
      }

      // For 5xx errors, we'll retry
      lastError = new Error(
        json.message || `Resend API returned ${response.status}`
      );
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }

    // Exponential backoff: wait before retrying
    if (attempt < MAX_RETRIES - 1) {
      const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    ok: false,
    status: 502,
    error: lastError?.message || "Resend API request failed after retries",
  };
}

