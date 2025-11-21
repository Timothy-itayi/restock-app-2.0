/**
 * Tests for email formatting utilities
 */

import { describe, it, expect } from 'vitest';
import { formatEmailHtml, formatEmailWithItems } from '../../shared/utils/emailFormat';

describe('Email formatting utilities', () => {
  describe('formatEmailHtml', () => {
    it('should convert double newlines to paragraphs', () => {
      const input = 'First paragraph\n\nSecond paragraph';
      const output = formatEmailHtml(input);
      
      expect(output).toContain('<p>');
      expect(output.split('<p>').length).toBeGreaterThan(2);
    });

    it('should convert single newlines to br tags', () => {
      const input = 'Line one\nLine two';
      const output = formatEmailHtml(input);
      
      expect(output).toContain('<br>');
    });

    it('should handle bullet lists', () => {
      const input = '- Item 1\n- Item 2';
      const output = formatEmailHtml(input);
      
      expect(output).toContain('<ul>');
      expect(output).toContain('<li>');
    });

    it('should escape HTML special characters', () => {
      const input = 'Test & <test> "quotes"';
      const output = formatEmailHtml(input);
      
      expect(output).toContain('&amp;');
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
      expect(output).toContain('&quot;');
    });

    it('should handle empty input', () => {
      expect(formatEmailHtml('')).toBe('');
      expect(formatEmailHtml(null as any)).toBe('');
    });
  });

  describe('formatEmailWithItems', () => {
    it('should format email with items list', () => {
      const body = 'Please send these items:';
      const items = [
        { productName: 'Product A', quantity: 10 },
        { productName: 'Product B', quantity: 5 },
      ];
      const storeName = 'Test Store';

      const { text, html } = formatEmailWithItems(body, items, storeName);

      // Text format
      expect(text).toContain('Please send these items:');
      expect(text).toContain('10 x Product A');
      expect(text).toContain('5 x Product B');
      expect(text).toContain('Sent on behalf of Test Store');

      // HTML format
      expect(html).toContain('<ul>');
      expect(html).toContain('Product A');
      expect(html).toContain('Product B');
      expect(html).toContain('Test Store');
    });

    it('should handle empty items list', () => {
      const { text, html } = formatEmailWithItems('Body', [], 'Store');
      
      expect(text).toContain('Body');
      expect(html).not.toContain('<ul>');
    });

    it('should escape HTML in product names', () => {
      const items = [{ productName: 'Test & <Product>', quantity: 1 }];
      const { html } = formatEmailWithItems('Body', items, 'Store');
      
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
    });
  });
});

