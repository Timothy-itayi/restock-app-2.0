/**
 * Tests for Groq API client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { groqChat, groqVision, pdfToBase64DataUrl } from '../../shared/clients/groq';

// Mock fetch
global.fetch = vi.fn();

describe('Groq API client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('groqChat', () => {
    it('should send chat completion request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"items": []}' } }],
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await groqChat(
        {
          messages: [{ role: 'user', content: 'Test prompt' }],
          model: 'llama-3.1-70b-versatile',
        },
        'api_key'
      );

      expect(result.ok).toBe(true);
      expect(result.content).toBe('{"items": []}');
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        text: async () => 'API Error',
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await groqChat(
        {
          messages: [{ role: 'user', content: 'Test' }],
          model: 'llama-3.1-70b-versatile',
        },
        'api_key'
      );

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('Groq API error');
      }
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ choices: [] }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await groqChat(
        {
          messages: [{ role: 'user', content: 'Test' }],
          model: 'llama-3.1-70b-versatile',
        },
        'api_key'
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('groqVision', () => {
    it('should send vision request', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"items": []}' } }],
        }),
      };

      (global.fetch as any).mockResolvedValueOnce(mockResponse);

      const result = await groqVision(
        {
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: 'data:image/png;base64,test' } },
                { type: 'text', text: 'Extract items' },
              ],
            },
          ],
          model: 'llama-3.2-90b-vision-preview',
        },
        'api_key'
      );

      expect(result.ok).toBe(true);
    });
  });

  describe('pdfToBase64DataUrl', () => {
    it('should convert ArrayBuffer to base64 data URL', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 65; // 'A'
      view[1] = 66; // 'B'
      view[2] = 67; // 'C'
      view[3] = 68; // 'D'

      const result = pdfToBase64DataUrl(buffer, 'application/pdf');
      expect(result).toContain('data:application/pdf;base64,');
      expect(result).toContain('QUJDRA=='); // Base64 of 'ABCD'
    });
  });
});

