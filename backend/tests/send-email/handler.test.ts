/**
 * Tests for send-email handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleSendEmail } from '../../send-email/handler';
import * as resendClient from '../../shared/clients/resend';

// Mock dependencies
vi.mock('../../shared/clients/resend');

describe('Send email handler', () => {
  const mockEnv = {
    RESEND_API_KEY: 'test_key',
    EMAIL_FROM_ADDRESS: 'test@example.com',
    EMAIL_PROVIDER_URL: 'https://api.resend.com/emails',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email successfully', async () => {
    const mockResendResponse = {
      ok: true,
      status: 200,
      json: { id: 'resend_123' },
    };

    vi.spyOn(resendClient, 'sendViaResend').mockResolvedValueOnce(mockResendResponse);

    const request = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      body: 'Test body',
      replyTo: 'reply@example.com',
      storeName: 'Test Store',
      items: [{ productName: 'Product A', quantity: 10 }],
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.messageId).toBe('resend_123');
    expect(resendClient.sendViaResend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
        subject: 'Test Subject',
      }),
      'test_key',
      'https://api.resend.com/emails'
    );
  });

  it('should handle validation errors', async () => {
    const request = {
      to: 'invalid-email',
      subject: 'Test',
      body: 'Test',
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should handle Resend API errors', async () => {
    const mockResendResponse = {
      ok: false,
      status: 400,
      error: 'Invalid recipient',
    };

    vi.spyOn(resendClient, 'sendViaResend').mockResolvedValueOnce(mockResendResponse);

    const request = {
      to: 'recipient@example.com',
      subject: 'Test',
      body: 'Test',
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should support legacy supplierEmail field', async () => {
    const mockResendResponse = {
      ok: true,
      status: 200,
      json: { id: 'resend_123' },
    };

    vi.spyOn(resendClient, 'sendViaResend').mockResolvedValueOnce(mockResendResponse);

    const request = {
      supplierEmail: 'recipient@example.com',
      subject: 'Test',
      body: 'Test',
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
  });
});

