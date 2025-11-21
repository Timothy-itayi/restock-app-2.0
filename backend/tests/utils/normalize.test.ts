/**
 * Tests for text normalization utilities
 */

import { describe, it, expect } from 'vitest';
import { normalize, normalizeSupplier, normalizeProduct } from '../../shared/utils/normalize';

describe('Normalization utilities', () => {
  describe('normalize', () => {
    it('should trim whitespace', () => {
      expect(normalize('  test  ')).toBe('test');
    });

    it('should convert to lowercase', () => {
      expect(normalize('TEST')).toBe('test');
    });

    it('should remove duplicate punctuation', () => {
      expect(normalize('test!!')).toBe('test.');
    });

    it('should collapse multiple spaces', () => {
      expect(normalize('test    value')).toBe('test value');
    });

    it('should handle empty input', () => {
      expect(normalize('')).toBe('');
      expect(normalize(null as any)).toBe('');
    });
  });

  describe('normalizeSupplier', () => {
    it('should normalize and remove common suffixes', () => {
      expect(normalizeSupplier('Test Ltd')).toBe('test');
      expect(normalizeSupplier('Test Limited')).toBe('test');
      expect(normalizeSupplier('Test Inc.')).toBe('test');
      expect(normalizeSupplier('Test Corporation')).toBe('test');
    });

    it('should handle supplier names without suffixes', () => {
      expect(normalizeSupplier('Test Supplier')).toBe('test supplier');
    });
  });

  describe('normalizeProduct', () => {
    it('should normalize product names', () => {
      expect(normalizeProduct('  PRODUCT NAME  ')).toBe('product name');
    });

    it('should preserve product-specific formatting', () => {
      const result = normalizeProduct('Product 5kg');
      expect(result).toBe('product 5kg');
    });
  });
});

