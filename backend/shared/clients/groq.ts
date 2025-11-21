/**
 * Groq API client wrapper
 * Supports vision parsing and chat completion with structured prompts
 */

export interface GroqVisionPayload {
  messages: Array<{
    role: "user";
    content: Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;
  }>;
  model: string;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export interface GroqChatPayload {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  model: string;
  temperature?: number;
  response_format?: { type: "json_object" };
}

export interface GroqResponse {
  ok: boolean;
  content?: string;
  error?: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Calls Groq API for vision parsing (PDF/image to text)
 */
export async function groqVision(
  payload: GroqVisionPayload,
  apiKey: string
): Promise<GroqResponse> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        ok: false,
        error: `Groq API error: ${errorText}`,
      };
    }

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.message?.text;

    if (!content) {
      return {
        ok: false,
        error: "Empty response from Groq API",
      };
    }

    return {
      ok: true,
      content,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Groq API request failed",
    };
  }
}

/**
 * Calls Groq API for chat completion with structured prompt
 */
export async function groqChat(
  payload: GroqChatPayload,
  apiKey: string
): Promise<GroqResponse> {
  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      return {
        ok: false,
        error: `Groq API error: ${errorText}`,
      };
    }

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.message?.text;

    if (!content) {
      return {
        ok: false,
        error: "Empty response from Groq API",
      };
    }

    return {
      ok: true,
      content,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Groq API request failed",
    };
  }
}

/**
 * Converts PDF buffer to base64 data URL for vision API
 */
export function pdfToBase64DataUrl(buffer: ArrayBuffer, mimeType: string = "application/pdf"): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

