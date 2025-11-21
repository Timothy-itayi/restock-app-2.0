/**
 * Tests for Resend API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendViaResend, type ResendPayload } from '../../shared/clients/resend';

// Mock fetch globally
global.fetch = vi.fn();

describe('Resend API client', () => {
  const mockApiKey = 'test_api_key';
  const mockApiUrl = 'https://api.resend.com/emails';
  const mockPayload: ResendPayload = {
    from: 'test@example.com',
    to: 'recipient@example.com',
    reply_to: 'reply@example.com',
    subject: 'Test Subject',
    html: '<p>Test HTML</p>',
    text: 'Test text',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email successfully', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.json?.id).toBe('resend_123');
    expect(global.fetch).toHaveBeenCalledWith(
      mockApiUrl,
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${mockApiKey}`,
          'Content-Type': 'application/json',
        },
      })
    );
  });

  it('should handle 4xx client errors without retrying', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: async () => ({ error: 'Invalid recipient' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toBeTruthy();
    expect(global.fetch).toHaveBeenCalledTimes(1); // No retries for 4xx
  });

  it('should retry on 5xx server errors', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    };

    const mockSuccessResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    // First attempt fails, second succeeds
    (global.fetch as any)
      .mockResolvedValueOnce(mockErrorResponse)
      .mockResolvedValueOnce(mockSuccessResponse);

    const result = await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should retry on network errors', async () => {
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    // First attempt fails with network error, second succeeds
    (global.fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockSuccessResponse);

    const result = await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should exhaust retries and return error', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 502,
      json: async () => ({ error: 'Bad gateway' }),
    };

    (global.fetch as any).mockResolvedValue(mockErrorResponse);

    const result = await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(502);
    expect(global.fetch).toHaveBeenCalledTimes(3); // MAX_RETRIES
  });

  it('should use exponential backoff between retries', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    };

    (global.fetch as any).mockResolvedValue(mockErrorResponse);

    const startTime = Date.now();
    await sendViaResend(mockPayload, mockApiKey, mockApiUrl);
    const endTime = Date.now();

    // Should have waited between retries (at least 1s + 2s = 3s total)
    expect(endTime - startTime).toBeGreaterThan(2000);
  });

  it('should handle invalid JSON response', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(true);
    expect(result.json).toEqual({});
  });

  it('should use default API URL when not provided', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    await sendViaResend(mockPayload, mockApiKey);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.anything()
    );
  });

  it('should handle array of recipients', async () => {
    const payloadWithArray: ResendPayload = {
      ...mockPayload,
      to: ['recipient1@example.com', 'recipient2@example.com'],
    };

    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await sendViaResend(payloadWithArray, mockApiKey, mockApiUrl);

    expect(result.ok).toBe(true);
    const callArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(callArgs[1].body);
    expect(Array.isArray(body.to)).toBe(true);
  });

  it('should include all required headers', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    await sendViaResend(mockPayload, mockApiKey, mockApiUrl);

    const callArgs = (global.fetch as any).mock.calls[0];
    expect(callArgs[1].headers).toEqual({
      Authorization: `Bearer ${mockApiKey}`,
      'Content-Type': 'application/json',
    });
  });
});
