/**
 * Tests for block parser
 */

import { describe, it, expect } from 'vitest';
import {
  parseSupplierBlocks,
  createFallbackBlock,
} from '../../shared/parsing/blockParser';

describe('Block parser', () => {
  describe('parseSupplierBlocks', () => {
    it('should parse text into supplier blocks', () => {
      const text = `SUPPLIER: Supplier A
Product 1
Product 2

SUPPLIER: Supplier B
Product 3`;

      const blocks = parseSupplierBlocks(text);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].supplierName).toBe('Supplier A');
      expect(blocks[0].lines).toContain('Product 1');
      expect(blocks[1].supplierName).toBe('Supplier B');
    });

    it('should handle supplier headers with colons', () => {
      const text = `SUPPLIER: Test Supplier
Product A`;

      const blocks = parseSupplierBlocks(text);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].supplierName).toBe('Test Supplier');
    });

    it('should handle uppercase supplier names', () => {
      const text = `TEST SUPPLIER
Product A
Product B`;

      const blocks = parseSupplierBlocks(text);

      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const blocks = parseSupplierBlocks('');
      expect(blocks).toEqual([]);
    });

    it('should handle text without supplier headers', () => {
      const text = `Product A
Product B
Product C`;

      const blocks = parseSupplierBlocks(text);

      // Should create blocks or handle gracefully
      expect(Array.isArray(blocks)).toBe(true);
    });
  });

  describe('createFallbackBlock', () => {
    it('should create fallback block with all lines', () => {
      const text = `Line 1
Line 2
Line 3`;

      const block = createFallbackBlock(text);

      expect(block.supplierName).toBe('');
      expect(block.lines).toHaveLength(3);
      expect(block.lines[0]).toBe('Line 1');
    });

    it('should filter empty lines', () => {
      const text = `Line 1

Line 2

Line 3`;

      const block = createFallbackBlock(text);

      expect(block.lines).not.toContain('');
      expect(block.lines.length).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const block = createFallbackBlock('');
      expect(block.lines).toEqual([]);
    });
  });
});

