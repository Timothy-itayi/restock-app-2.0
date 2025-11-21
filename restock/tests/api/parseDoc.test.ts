/**
 * Tests for Parse Document API
 * @file tests/api/parseDoc.test.ts
 */

import { parseDocument, validateParsedItem, validateParsedItems } from '../../lib/api/parseDoc';

// Mock fetch globally
global.fetch = jest.fn();

describe('parseDoc API Integration', () => {
  const PARSE_DOC_URL = 'https://restock-parse-doc.parse-doc.workers.dev';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('parseDocument', () => {
    it('should parse document successfully', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { id: '1', product: 'Product A', supplier: 'Supplier A' },
            { id: '2', product: 'Product B', supplier: 'Supplier B' },
          ],
        }),
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.items).toHaveLength(2);
        expect(result.items[0].product).toBe('Product A');
      }
      expect(global.fetch).toHaveBeenCalledWith(
        PARSE_DOC_URL,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle empty items array', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
        }),
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No items found');
      }
    });

    it('should validate file before sending', async () => {
      const result = await parseDocument(null as any);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid file');
      }
    });

    it('should reject files that are too large', async () => {
      const largeFile = {
        uri: 'file://large.pdf',
        name: 'large.pdf',
        size: 11 * 1024 * 1024, // 11MB
      };

      const result = await parseDocument(largeFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('too large');
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Server error');
      }
    });

    it('should handle network errors', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Network error');
      }
    });

    it('should handle invalid JSON response', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid server response');
      }
    });

    it('should handle file size errors from server', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        json: async () => ({
          success: false,
          error: 'File too large',
        }),
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('File too large');
      }
    });

    it('should handle missing items in response', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Missing items
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Invalid response format');
      }
    });
  });

  describe('Item validation', () => {
    it('should validate parsed item structure', () => {
      const validItem = {
        id: '1',
        product: 'Product A',
        supplier: 'Supplier A',
      };
      const invalidItem = { invalid: 'data' };

      expect(validateParsedItem(validItem)).toBe(true);
      expect(validateParsedItem(invalidItem)).toBe(false);
    });

    it('should validate parsed items array', () => {
      const validItems = [
        { id: '1', product: 'Product A', supplier: 'Supplier A' },
        { id: '2', product: 'Product B', supplier: 'Supplier B' },
      ];
      const invalidItems = [
        { id: '1', product: 'Product A', supplier: 'Supplier A' },
        { invalid: 'data' },
      ];

      expect(validateParsedItems(validItems)).toBe(true);
      expect(validateParsedItems(invalidItems)).toBe(false);
    });

    it('should filter out items with empty product names', async () => {
      const mockFile = {
        uri: 'file://test.pdf',
        name: 'test.pdf',
        mimeType: 'application/pdf',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [
            { id: '1', product: 'Product A', supplier: 'Supplier A' },
            { id: '2', product: '', supplier: 'Supplier B' }, // Empty product
            { id: '3', product: 'Product C', supplier: 'Supplier C' },
          ],
        }),
      });

      const result = await parseDocument(mockFile);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should filter out item with empty product
        expect(result.items).toHaveLength(2);
        expect(result.items.every(item => item.product.trim().length > 0)).toBe(true);
      }
    });
  });
});
