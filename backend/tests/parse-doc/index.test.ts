/**
 * Tests for parse-doc worker entry point
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../../parse-doc/index';
import * as handler from '../../parse-doc/handler';

// Mock handler
vi.mock('../../parse-doc/handler', () => ({
  handleParseDoc: vi.fn(),
}));

describe('Parse doc worker', () => {
  const mockEnv = {
    GROQ_API_KEY: 'test_key',
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

  it('should handle POST request with form-data', async () => {
    const mockHandlerResponse = new Response(
      JSON.stringify({ items: [] }),
      { status: 200 }
    );

    vi.spyOn(handler, 'handleParseDoc').mockResolvedValueOnce(
      mockHandlerResponse
    );

    const formData = new FormData();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new Request('https://example.com', {
      method: 'POST',
      body: formData,
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.status).toBe(200);
    expect(handler.handleParseDoc).toHaveBeenCalled();
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

  it('should reject non-form-data content type', async () => {
    const request = new Request('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await worker.fetch(request, mockEnv);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should reject request without file', async () => {
    const formData = new FormData();

    const request = new Request('https://example.com', {
      method: 'POST',
      body: formData,
    });

    const response = await worker.fetch(request, mockEnv);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('should add CORS headers to responses', async () => {
    const mockHandlerResponse = new Response(
      JSON.stringify({ items: [] }),
      { status: 200 }
    );

    vi.spyOn(handler, 'handleParseDoc').mockResolvedValueOnce(
      mockHandlerResponse
    );

    const formData = new FormData();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new Request('https://example.com', {
      method: 'POST',
      body: formData,
    });

    const response = await worker.fetch(request, mockEnv);

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should handle handler errors gracefully', async () => {
    vi.spyOn(handler, 'handleParseDoc').mockRejectedValueOnce(
      new Error('Handler error')
    );

    const formData = new FormData();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    formData.append('file', file);

    const request = new Request('https://example.com', {
      method: 'POST',
      body: formData,
    });

    const response = await worker.fetch(request, mockEnv);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.success).toBe(false);
  });
});

