/**
 * Tests for parse-doc handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleParseDoc } from '../../parse-doc/handler';
import * as groqClient from '../../shared/clients/groq';

// Mock dependencies
vi.mock('../../shared/clients/groq');
vi.mock('../../shared/parsing/pdfExtract', () => ({
  extractPdfText: vi.fn().mockResolvedValue(null), // Always fallback to vision
}));

describe('Parse doc handler', () => {
  const mockEnv = {
    GROQ_API_KEY: 'test_key',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should parse document via vision API', async () => {
    const mockGroqResponse = {
      ok: true,
      content: JSON.stringify({
        items: [
          { supplier: 'Supplier A', product: 'Product A' },
          { product: 'Product B' },
        ],
      }),
    };

    vi.spyOn(groqClient, 'groqVision').mockResolvedValueOnce(mockGroqResponse);
    vi.spyOn(groqClient, 'pdfToBase64DataUrl').mockReturnValueOnce('data:application/pdf;base64,test');

    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const response = await handleParseDoc(file, mockEnv);
    const json = await response.json();

    expect(json.items).toHaveLength(2);
    expect(json.items[0].product).toBe('product a');
    expect(json.items[0].supplier).toBe('supplier a');
  });

  it('should reject files that are too large', async () => {
    // Create a file larger than 10MB
    const largeContent = new ArrayBuffer(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

    const response = await handleParseDoc(file, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(response.status).toBe(413);
  });

  it('should reject non-PDF/image files', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    const response = await handleParseDoc(file, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should handle Groq API errors', async () => {
    const mockGroqResponse = {
      ok: false,
      error: 'API Error',
    };

    vi.spyOn(groqClient, 'groqVision').mockResolvedValueOnce(mockGroqResponse);
    vi.spyOn(groqClient, 'pdfToBase64DataUrl').mockReturnValueOnce('data:application/pdf;base64,test');

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const response = await handleParseDoc(file, mockEnv);
    const json = await response.json();

    expect(json.success).toBe(false);
  });

  it('should normalize product and supplier names', async () => {
    const mockGroqResponse = {
      ok: true,
      content: JSON.stringify({
        items: [
          { supplier: '  SUPPLIER A  ', product: '  PRODUCT A  ' },
        ],
      }),
    };

    vi.spyOn(groqClient, 'groqVision').mockResolvedValueOnce(mockGroqResponse);
    vi.spyOn(groqClient, 'pdfToBase64DataUrl').mockReturnValueOnce('data:application/pdf;base64,test');

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const response = await handleParseDoc(file, mockEnv);
    const json = await response.json();

    expect(json.items[0].supplier).toBe('supplier a');
    expect(json.items[0].product).toBe('product a');
  });

  it('should filter out items with empty product names', async () => {
    const mockGroqResponse = {
      ok: true,
      content: JSON.stringify({
        items: [
          { supplier: 'Supplier A', product: 'Product A' },
          { supplier: 'Supplier B', product: '' }, // Empty product
          { supplier: 'Supplier C' }, // Missing product
        ],
      }),
    };

    vi.spyOn(groqClient, 'groqVision').mockResolvedValueOnce(mockGroqResponse);
    vi.spyOn(groqClient, 'pdfToBase64DataUrl').mockReturnValueOnce('data:application/pdf;base64,test');

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const response = await handleParseDoc(file, mockEnv);
    const json = await response.json();

    expect(json.items).toHaveLength(1);
    expect(json.items[0].product).toBe('product a');
  });
});

