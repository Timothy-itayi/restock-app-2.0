/**
 * Tests for send-email worker entry point
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../../send-email/index';
import * as handler from '../../send-email/handler';

// Mock handler
vi.mock('../../send-email/handler', () => ({
  handleSendEmail: vi.fn(),
}));

describe('Send email worker', () => {
  const mockEnv = {
    RESEND_API_KEY: 'test_key',
    EMAIL_FROM_ADDRESS: 'test@example.com',
    EMAIL_PROVIDER_URL: 'https://api.resend.com/emails',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle OPTIONS preflight request', async () => {
    const request = new Request('https://example.com', {
      method: 'OPTIONS',
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should handle POST request', async () => {
    const mockHandlerResponse = new Response(
      JSON.stringify({ success: true, messageId: '123' }),
      { status: 200 }
    );

    vi.spyOn(handler, 'handleSendEmail').mockResolvedValueOnce(
      mockHandlerResponse
    );

    const request = new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(handler.handleSendEmail).toHaveBeenCalled();
  });

  it('should reject non-POST/OPTIONS methods', async () => {
    const request = new Request('https://example.com', {
      method: 'GET',
    });

    const response = await worker.fetch(request, mockEnv);
    const json = await response.json();

    expect(response.status).toBe(405);
    expect(json.success).toBe(false);
  });

  it('should handle invalid JSON', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await worker.fetch(request, mockEnv);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should add CORS headers to responses', async () => {
    const mockHandlerResponse = new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );

    vi.spyOn(handler, 'handleSendEmail').mockResolvedValueOnce(
      mockHandlerResponse
    );

    const request = new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      }),
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should handle handler errors gracefully', async () => {
    vi.spyOn(handler, 'handleSendEmail').mockRejectedValueOnce(
      new Error('Handler error')
    );

    const request = new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      }),
    });

    const response = await worker.fetch(request, mockEnv);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});

