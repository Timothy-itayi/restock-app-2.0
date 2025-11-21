/**
 * Tests for parsed document validation
 */

import { describe, it, expect } from 'vitest';
import { validateParsedDoc, validateParsedItem, ParsedDocSchema } from '../../shared/validation/parsedDoc';

describe('Parsed document validation', () => {
  describe('ParsedDocSchema', () => {
    it('should validate correct parsed document', () => {
      const doc = {
        items: [
          { supplier: 'Supplier A', product: 'Product A' },
          { supplier: 'Supplier B', product: 'Product B', quantity: 5 },
        ],
      };

      const result = ParsedDocSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('should require items array', () => {
      const doc = {};

      const result = ParsedDocSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it('should require product name', () => {
      const doc = {
        items: [
          { supplier: 'Supplier A' }, // Missing product
        ],
      };

      const result = ParsedDocSchema.safeParse(doc);
      expect(result.success).toBe(false);
    });

    it('should allow optional supplier', () => {
      const doc = {
        items: [
          { product: 'Product A' }, // No supplier
        ],
      };

      const result = ParsedDocSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });

    it('should allow optional quantity', () => {
      const doc = {
        items: [
          { supplier: 'Supplier A', product: 'Product A' }, // No quantity
        ],
      };

      const result = ParsedDocSchema.safeParse(doc);
      expect(result.success).toBe(true);
    });
  });

  describe('validateParsedDoc', () => {
    it('should return validated items', () => {
      const input = {
        items: [
          { supplier: 'Supplier A', product: 'Product A' },
          { product: 'Product B' },
        ],
      };

      const result = validateParsedDoc(input);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].product).toBe('Product A');
    });

    it('should return empty array on validation failure', () => {
      const input = {
        items: [
          { supplier: 'Supplier A' }, // Missing product
        ],
      };

      const result = validateParsedDoc(input);
      expect(result.items).toEqual([]);
    });

    it('should handle invalid input gracefully', () => {
      const result = validateParsedDoc(null as any);
      expect(result.items).toEqual([]);
    });
  });

  describe('validateParsedItem', () => {
    it('should validate correct item', () => {
      const item = { supplier: 'Supplier A', product: 'Product A' };
      const result = validateParsedItem(item);
      expect(result).not.toBeNull();
      expect(result?.product).toBe('Product A');
    });

    it('should return null for invalid item', () => {
      const item = { supplier: 'Supplier A' }; // Missing product
      const result = validateParsedItem(item);
      expect(result).toBeNull();
    });
  });
});

