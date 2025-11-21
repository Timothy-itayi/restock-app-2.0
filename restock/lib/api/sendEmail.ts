export type EmailItem = {
  productName: string;
  quantity: number;
};

/**
 * Validates email format.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Request format for send-email endpoint.
 * Matches serverless function requirements: { to, replyTo, subject, text }
 */
export type SendEmailRequest = {
  to: string; // Supplier email (renamed from supplierEmail)
  replyTo: string;
  subject: string;
  text: string; // Email body (renamed from body)
  items?: Array<{ productName: string; quantity: number }>; // Optional items for backend formatting
  storeName?: string; // Optional store name for email formatting
  deviceId?: string; // For rate limiting
};

export type SendEmailResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

/**
 * Sends an email to a supplier via the serverless endpoint.
 * Validates email format before sending.
 */
export async function sendEmail(request: Omit<SendEmailRequest, 'deviceId'>): Promise<SendEmailResponse> {
  console.log('[sendEmail] Starting email send request');
  console.log('[sendEmail] Request:', {
    to: request.to,
    replyTo: request.replyTo,
    subject: request.subject,
    textLength: request.text?.length,
    itemsCount: request.items?.length || 0,
    storeName: request.storeName,
  });
  
  // Validate email format on client side
  if (!isValidEmail(request.to)) {
    console.error('[sendEmail] Invalid recipient email:', request.to);
    return {
      success: false,
      message: 'Invalid supplier email format',
      error: 'INVALID_EMAIL',
    };
  }

  if (!isValidEmail(request.replyTo)) {
    console.error('[sendEmail] Invalid reply-to email:', request.replyTo);
    return {
      success: false,
      message: 'Invalid reply-to email format',
      error: 'INVALID_REPLY_TO',
    };
  }

  try {
    // Get device ID for rate limiting
    const { getDeviceId } = await import('../utils/deviceId');
    const deviceId = await getDeviceId();
    console.log('[sendEmail] Device ID:', deviceId);

    const url = 'https://restock-send-email.parse-doc.workers.dev';
    const payload = {
      ...request,
      deviceId,
    };
    
    console.log('[sendEmail] Sending request to:', url);
    console.log('[sendEmail] Payload (sanitized):', {
      to: payload.to,
      replyTo: payload.replyTo,
      subject: payload.subject,
      textLength: payload.text?.length,
      itemsCount: payload.items?.length || 0,
      storeName: payload.storeName,
      deviceId: payload.deviceId,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[sendEmail] Response status:', response.status, response.statusText);
    console.log('[sendEmail] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sendEmail] Error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error('[sendEmail] Parsed error data:', errorData);
      } catch {
        errorData = { message: errorText };
        console.error('[sendEmail] Could not parse error as JSON');
      }
      
      return {
        success: false,
        message: errorData.message || `Email send failed: ${response.status}`,
        error: errorData.error || 'SEND_FAILED',
      };
    }

    const data = await response.json();
    console.log('[sendEmail] Success response:', data);
    
    // Validate response format
    if (data.success === true) {
      console.log('[sendEmail] Email sent successfully, messageId:', data.messageId);
      return { success: true, ...data };
    } else {
      console.error('[sendEmail] Response indicates failure:', data);
      return {
        success: false,
        message: data.message || 'Email send failed',
        error: data.error || 'UNKNOWN_ERROR',
      };
    }
  } catch (error: any) {
    console.error('[sendEmail] Exception caught:', error);
    console.error('[sendEmail] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    
    // Check for network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      console.error('[sendEmail] Network error detected');
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'NETWORK_ERROR',
      };
    }
    
    return {
      success: false,
      message: error.message || 'Failed to send email',
      error: 'UNKNOWN_ERROR',
    };
  }
}

/**
 * Generates email body text for a given supplier and items.
 * Note: This endpoint doesn't exist in the backend - email body is generated client-side.
 */
export async function generateEmailBody(
  supplierName: string,
  items: EmailItem[],
  senderName: string,
  storeName?: string
): Promise<string> {
  // Generate email body locally (no backend endpoint for this)
  const itemsList = items
    .map(item => `- ${item.productName} (Qty: ${item.quantity})`)
    .join('\n');
  
  return `Hello ${supplierName},

I would like to place an order for the following items:

${itemsList}

Please let me know if these items are available and when they can be delivered.

Thank you,
${senderName}${storeName ? `\n${storeName}` : ''}`;
}

