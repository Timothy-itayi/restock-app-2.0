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
  // Validate email format on client side
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

  try {
    // Get device ID for rate limiting
    const { getDeviceId } = await import('../utils/deviceId');
    const deviceId = await getDeviceId();

    const response = await fetch('https://restock-send-email.parse-doc.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        deviceId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return {
        success: false,
        message: errorData.message || `Email send failed: ${response.status}`,
        error: errorData.error || 'SEND_FAILED',
      };
    }

    const data = await response.json();
    
    // Validate response format
    if (data.success === true) {
      return { success: true, ...data };
    } else {
      return {
        success: false,
        message: data.message || 'Email send failed',
        error: data.error || 'UNKNOWN_ERROR',
      };
    }
  } catch (error: any) {
    console.error('Failed to send email:', error);
    
    // Check for network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
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

