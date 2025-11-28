/**
 * Groq API client wrapper using groq-sdk
 * Supports vision parsing and chat completion with structured prompts
 */

import Groq from "groq-sdk";

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
  max_tokens?: number;
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

/**
 * Calls Groq API for vision parsing (image to text)
 * Note: Only accepts image files (PNG/JPG), NOT PDFs
 */
export async function groqVision(
  payload: GroqVisionPayload,
  apiKey: string
): Promise<GroqResponse> {
  try {
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: payload.model,
      messages: payload.messages as any, // SDK handles the content array format
      temperature: payload.temperature ?? 0.1,
      max_tokens: payload.max_tokens ?? 4096, // Ensure enough tokens for large responses
      response_format: payload.response_format,
    });

    const content = completion.choices[0]?.message?.content;

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
  } catch (err: any) {
    // Extract error message from SDK error
    const errorMessage = err?.message || err?.error?.message || "Groq API request failed";
    return {
      ok: false,
      error: `Groq API error: ${errorMessage}`,
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
    const groq = new Groq({ apiKey });

    const completion = await groq.chat.completions.create({
      model: payload.model,
      messages: payload.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: payload.temperature ?? 0.1,
      response_format: payload.response_format,
    });

    const content = completion.choices[0]?.message?.content;

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
  } catch (err: any) {
    // Extract error message from SDK error
    const errorMessage = err?.message || err?.error?.message || "Groq API request failed";
    return {
      ok: false,
      error: `Groq API error: ${errorMessage}`,
    };
  }
}

/**
 * Converts image buffer to base64 data URL for vision API
 * Note: Only use for image files (PNG/JPG), NOT PDFs
 */
export function imageToBase64DataUrl(
  buffer: ArrayBuffer,
  mimeType: string = "image/png"
): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * @deprecated Use imageToBase64DataUrl instead. PDFs cannot be sent to vision API.
 * This function is kept for backwards compatibility but should not be used.
 */
export function pdfToBase64DataUrl(
  buffer: ArrayBuffer,
  mimeType: string = "application/pdf"
): string {
  console.warn("pdfToBase64DataUrl: PDFs cannot be sent to Groq vision API. Use image files only.");
  // This will fail - PDFs are not supported by Groq vision API
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}
