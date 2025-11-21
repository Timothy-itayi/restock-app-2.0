/**
 * Email request validation using Zod
 */

import { z } from "zod";

export const EmailItemSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
});

export const EmailPayloadSchema = z.object({
  to: z.string().email("Invalid recipient email").optional(),
  supplierEmail: z.string().email("Invalid supplier email").optional(),
  subject: z.string().min(1, "Subject is required"),
  html: z.string().optional(),
  body: z.string().min(1, "Email body is required"),
  replyTo: z.string().email("Invalid reply-to email").optional(),
  storeName: z.string().optional(),
  items: z.array(EmailItemSchema).optional().default([]),
}).refine(
  (data) => data.to || data.supplierEmail,
  {
    message: "Either 'to' or 'supplierEmail' is required",
    path: ["to"],
  }
);

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;

/**
 * Validates email request payload
 * Returns validated data or error message
 */
export function validateEmailRequest(
  input: unknown
): { ok: true; value: EmailPayload & { to: string } } | { ok: false; error: string } {
  try {
    const result = EmailPayloadSchema.safeParse(input);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return {
        ok: false,
        error: firstError?.message || "Validation failed",
      };
    }
    
    // Normalize: ensure 'to' field is always present
    const payload = result.data;
    const normalized = {
      ...payload,
      to: payload.to || payload.supplierEmail || "",
    };
    
    if (!normalized.to) {
      return {
        ok: false,
        error: "Recipient email is required",
      };
    }
    
    return { ok: true, value: normalized };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Validation error",
    };
  }
}

