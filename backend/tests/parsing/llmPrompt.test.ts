/**
 * Tests for LLM prompt builder
 */

import { describe, it, expect } from 'vitest';
import {
  buildExtractionPrompt,
  buildVisionPrompt,
} from '../../shared/parsing/llmPrompt';
import type { SupplierBlock } from '../../shared/parsing/blockParser';

describe('LLM prompt builder', () => {
  describe('buildExtractionPrompt', () => {
    it('should build prompt from supplier blocks', () => {
      const blocks: SupplierBlock[] = [
        {
          supplierName: 'Supplier A',
          lines: ['Product 1', 'Product 2'],
        },
        {
          supplierName: 'Supplier B',
          lines: ['Product 3'],
        },
      ];

      const prompt = buildExtractionPrompt(blocks);

      expect(prompt).toContain('Supplier A');
      expect(prompt).toContain('Product 1');
      expect(prompt).toContain('Supplier B');
      expect(prompt).toContain('JSON');
    });

    it('should handle empty blocks', () => {
      const prompt = buildExtractionPrompt([]);
      expect(prompt).toContain('JSON');
      expect(prompt).toContain('items');
    });

    it('should include JSON schema instructions', () => {
      const blocks: SupplierBlock[] = [
        {
          supplierName: 'Test Supplier',
          lines: ['Product A'],
        },
      ];

      const prompt = buildExtractionPrompt(blocks);

      expect(prompt).toContain('items');
      expect(prompt).toContain('supplier');
      expect(prompt).toContain('product');
    });

    it('should handle blocks without supplier names', () => {
      const blocks: SupplierBlock[] = [
        {
          supplierName: '',
          lines: ['Product A', 'Product B'],
        },
      ];

      const prompt = buildExtractionPrompt(blocks);

      expect(prompt).toContain('Product A');
      expect(prompt).toContain('Product B');
    });
  });

  describe('buildVisionPrompt', () => {
    it('should build vision prompt', () => {
      const prompt = buildVisionPrompt();

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('items');
      expect(prompt).toContain('supplier');
      expect(prompt).toContain('product');
    });

    it('should include extraction rules', () => {
      const prompt = buildVisionPrompt();

      expect(prompt).toContain('No extra text');
      expect(prompt).toContain('No markdown');
      expect(prompt).toContain('Ignore prices');
    });

    it('should specify JSON-only response', () => {
      const prompt = buildVisionPrompt();

      expect(prompt).toContain('JSON');
      expect(prompt).toContain('No markdown');
      expect(prompt).toContain('No comments');
    });
  });
});

