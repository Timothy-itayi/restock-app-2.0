/**
 * Tests for Resend API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendViaResend } from '../../shared/clients/resend';

// Mock fetch
global.fetch = vi.fn();

describe('Resend API client', () => {
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

    const result = await sendViaResend(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
      'api_key'
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.json?.id).toBe('resend_123');
    }
  });

  it('should retry on 5xx errors', async () => {
    const mockResponse500 = {
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    };

    const mockResponse200 = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    // First call fails, second succeeds
    (global.fetch as any)
      .mockResolvedValueOnce(mockResponse500)
      .mockResolvedValueOnce(mockResponse200);

    const result = await sendViaResend(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
      'api_key'
    );

    expect(result.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('should not retry on 4xx errors', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad Request' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    const result = await sendViaResend(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
      'api_key'
    );

    expect(result.ok).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    if (!result.ok) {
      expect(result.error).toBeTruthy();
    }
  });

  it('should include correct headers', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({ id: 'resend_123' }),
    };

    (global.fetch as any).mockResolvedValueOnce(mockResponse);

    await sendViaResend(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
      'test_api_key'
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test_api_key',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should fail after max retries', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    };

    (global.fetch as any).mockResolvedValue(mockResponse);

    const result = await sendViaResend(
      {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      },
      'api_key'
    );

    expect(result.ok).toBe(false);
    expect(global.fetch).toHaveBeenCalledTimes(3); // Max retries
  });
});

