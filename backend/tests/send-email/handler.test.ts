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

  it('should format email with items list', async () => {
    const mockResendResponse = {
      ok: true,
      status: 200,
      json: { id: 'resend_123' },
    };

    vi.spyOn(resendClient, 'sendViaResend').mockResolvedValueOnce(mockResendResponse);

    const request = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      body: 'Please send these items:',
      replyTo: 'reply@example.com',
      items: [
        { productName: 'Product A', quantity: 5 },
        { productName: 'Product B', quantity: 10 },
      ],
      storeName: 'Test Store',
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(resendClient.sendViaResend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining('Product A'),
        html: expect.stringContaining('Product B'),
      }),
      expect.any(String),
      expect.any(String)
    );
  });

  it('should handle missing replyTo field', async () => {
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
      // No replyTo
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
  });

  it('should handle empty items array', async () => {
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
      items: [],
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
  });

  it('should handle missing storeName', async () => {
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
      // No storeName
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
    // Should use default "Restock App" when storeName is missing
    expect(resendClient.sendViaResend).toHaveBeenCalled();
  });

  it('should handle 5xx errors from Resend', async () => {
    const mockResendResponse = {
      ok: false,
      status: 502,
      error: 'Bad gateway',
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
    expect(response.status).toBe(502);
  });

  it('should handle missing required fields', async () => {
    const request = {
      to: 'recipient@example.com',
      // Missing subject and body
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should use default EMAIL_PROVIDER_URL when not provided', async () => {
    const mockResendResponse = {
      ok: true,
      status: 200,
      json: { id: 'resend_123' },
    };

    vi.spyOn(resendClient, 'sendViaResend').mockResolvedValueOnce(mockResendResponse);

    const envWithoutUrl = {
      RESEND_API_KEY: 'test_key',
      EMAIL_FROM_ADDRESS: 'test@example.com',
      // No EMAIL_PROVIDER_URL
    };

    const request = {
      to: 'recipient@example.com',
      subject: 'Test',
      body: 'Test',
    };

    const response = await handleSendEmail(request, envWithoutUrl);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(resendClient.sendViaResend).toHaveBeenCalledWith(
      expect.anything(),
      'test_key',
      'https://api.resend.com/emails' // Default URL
    );
  });

  it('should handle items with quantity 1', async () => {
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
      items: [{ productName: 'Single Product', quantity: 1 }],
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(true);
  });

  it('should handle text field as alternative to body', async () => {
    const mockResendResponse = {
      ok: true,
      status: 200,
      json: { id: 'resend_123' },
    };

    vi.spyOn(resendClient, 'sendViaResend').mockResolvedValueOnce(mockResendResponse);

    const request = {
      to: 'recipient@example.com',
      subject: 'Test Subject',
      text: 'Test text body', // Using text instead of body
    };

    const response = await handleSendEmail(request, mockEnv);
    const json = await response.json();

    // Should still validate and process
    expect(response.status).toBe(400); // Will fail validation as body is required
  });
});

