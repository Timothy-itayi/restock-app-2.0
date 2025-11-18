/**
 * Send Email Serverless Function (Resend)
 * 
 * This is a placeholder for the serverless function that will be deployed.
 * Replace with your actual serverless platform (Vercel, Netlify, AWS Lambda, etc.)
 * 
 * Requirements:
 * - POST { to, replyTo, subject, text, deviceId }
 * - Validate input server-side
 * - Rate limit by device ID
 * - Use Resend API
 * - Returns { success: true }
 * - Block invalid email formats
 */

import { Resend } from 'resend';

// Initialize Resend (replace with your API key from environment variables)
const resend = new Resend(process.env.RESEND_API_KEY);

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Rate limit: 10 emails per minute per device
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface SendEmailRequest {
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  deviceId?: string;
}

interface SendEmailResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Validates email format server-side.
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Checks rate limit for a device ID.
 * Returns true if allowed, false if rate limited.
 */
function checkRateLimit(deviceId: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(deviceId);

  if (!limit || now > limit.resetAt) {
    // Reset or initialize
    rateLimitMap.set(deviceId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  limit.count++;
  return true;
}

/**
 * Main handler for the send-email endpoint.
 */
export async function handler(request: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    // Validate required fields
    if (!request.to || !request.replyTo || !request.subject || !request.text) {
      return {
        success: false,
        message: 'Missing required fields: to, replyTo, subject, and text are required',
        error: 'MISSING_FIELDS',
      };
    }

    // Validate email formats server-side
    if (!isValidEmail(request.to)) {
      return {
        success: false,
        message: 'Invalid supplier email format',
        error: 'INVALID_EMAIL',
      };
    }

    if (!isValidEmail(request.replyTo)) {
      return {
        success: false,
        message: 'Invalid reply-to email format',
        error: 'INVALID_REPLY_TO',
      };
    }

    // Rate limiting by device ID
    if (request.deviceId) {
      if (!checkRateLimit(request.deviceId)) {
        return {
          success: false,
          message: 'Rate limit exceeded. Please wait before sending more emails.',
          error: 'RATE_LIMIT_EXCEEDED',
        };
      }
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev', // Replace with your verified domain
      to: request.to,
      replyTo: request.replyTo,
      subject: request.subject,
      text: request.text,
    });

    if (error) {
      console.error('Resend API error:', error);
      return {
        success: false,
        message: 'Failed to send email. Please try again.',
        error: 'RESEND_ERROR',
      };
    }

    // Success - email sent
    return {
      success: true,
      message: 'Email sent successfully',
    };
  } catch (error: any) {
    console.error('Send email error:', error);
    
    // Handle invalid supplier email gracefully
    if (error.message?.includes('invalid') || error.message?.includes('email')) {
      return {
        success: false,
        message: 'Invalid supplier email. Please check the email address and try again.',
        error: 'INVALID_SUPPLIER_EMAIL',
      };
    }

    return {
      success: false,
      message: 'An unexpected error occurred. Please try again.',
      error: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Example usage for different serverless platforms:
 * 
 * Vercel:
 * export default async function handler(req: NextApiRequest, res: NextApiResponse) {
 *   if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
 *   const result = await handler(req.body);
 *   return res.status(result.success ? 200 : 400).json(result);
 * }
 * 
 * Netlify:
 * exports.handler = async (event) => {
 *   if (event.httpMethod !== 'POST') {
 *     return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
 *   }
 *   const result = await handler(JSON.parse(event.body));
 *   return { statusCode: result.success ? 200 : 400, body: JSON.stringify(result) };
 * }
 * 
 * AWS Lambda:
 * export const handler = async (event) => {
 *   if (event.httpMethod !== 'POST') {
 *     return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
 *   }
 *   const result = await handler(JSON.parse(event.body));
 *   return { statusCode: result.success ? 200 : 400, body: JSON.stringify(result) };
 * }
 */

