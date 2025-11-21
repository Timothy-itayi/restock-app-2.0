/**
 * Tests for Normalization Utilities
 * @file tests/utils/normalise.test.ts
 */
import {
  normalizeSupplierName,
  normalizeProductName,
  safeString,
  ensureId
} from '../../lib/utils/normalise';

describe('Normalization Utilities', () => {
  describe('normalizeSupplierName', () => {
    it('should trim and lowercase supplier names', () => {
      expect(normalizeSupplierName('  Test Supplier  ')).toBe('test supplier');
      expect(normalizeSupplierName('ACME FOODS')).toBe('acme foods');
    });

    it('should handle empty strings', () => {
      expect(normalizeSupplierName('')).toBe('');
      expect(normalizeSupplierName('   ')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(normalizeSupplierName(null as any)).toBe('');
      expect(normalizeSupplierName(undefined as any)).toBe('');
    });
  });

  describe('normalizeProductName', () => {
    it('should trim and lowercase product names', () => {
      expect(normalizeProductName('  Test Product  ')).toBe('test product');
      expect(normalizeProductName('PRODUCT NAME')).toBe('product name');
    });

    it('should handle empty strings', () => {
      expect(normalizeProductName('')).toBe('');
      expect(normalizeProductName('   ')).toBe('');
    });
  });

  describe('safeString', () => {
    it('should trim string values', () => {
      expect(safeString('  test  ')).toBe('test');
    });

    it('should return empty string for non-string values', () => {
      expect(safeString(123)).toBe('');
      expect(safeString(null)).toBe('');
      expect(safeString(undefined)).toBe('');
      expect(safeString({})).toBe('');
    });
  });

  describe('ensureId', () => {
    it('should generate unique IDs with prefix', () => {
      const id1 = ensureId('test');
      const id2 = ensureId('test');

      expect(id1).toMatch(/^test-/);
      expect(id2).toMatch(/^test-/);
      expect(id1).not.toBe(id2);
    });

    it('should use default prefix when not provided', () => {
      const id = ensureId();
      expect(id).toMatch(/^id-/);
    });
  });
});
