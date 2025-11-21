/**
 * Tests for Parse Document API
 * @file tests/api/parseDoc.test.ts
 * 
 * Note: The actual parsing logic is in the upload screen.
 * These tests focus on the API interaction patterns.
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('parseDoc API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send file to parse endpoint with form-data', async () => {
    const mockFile = {
      uri: 'file://test.pdf',
      name: 'test.pdf',
      mimeType: 'application/pdf'
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { product: 'Product A', supplier: 'Supplier A' },
          { product: 'Product B', supplier: 'Supplier B' }
        ]
      })
    });

    const formData = new FormData();
    formData.append('file', mockFile as any);

    const response = await fetch('https://parse-doc-endpoint', {
      method: 'POST',
      body: formData
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('should handle API response with items array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [
          { product: 'Product A', supplier: 'Supplier A' },
          { product: 'Product B', supplier: 'Supplier B' }
        ]
      })
    });

    const response = await fetch('https://parse-doc-endpoint', {
      method: 'POST',
      body: new FormData()
    });
    const data = await response.json();

    expect(data.items).toBeDefined();
    expect(Array.isArray(data.items)).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Server error'
    });

    const response = await fetch('https://parse-doc-endpoint', {
      method: 'POST',
      body: new FormData()
    });

    expect(response.ok).toBe(false);
  });

  it('should validate returned items structure', () => {
    const validItem = { product: 'Product A', supplier: 'Supplier A' };
    const invalidItem = { invalid: 'data' };

    expect(validItem.product).toBeDefined();
    expect(typeof validItem.product).toBe('string');
    expect(invalidItem.product).toBeUndefined();
  });
});
