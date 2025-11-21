/**
 * Tests for email validation
 */

import { describe, it, expect } from 'vitest';
import { validateEmailRequest, EmailPayloadSchema } from '../../shared/validation/email';

describe('Email validation', () => {
  describe('EmailPayloadSchema', () => {
    it('should validate correct email payload', () => {
      const payload = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body',
        replyTo: 'reply@example.com',
        storeName: 'Test Store',
        items: [],
      };

      const result = EmailPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should require to or supplierEmail', () => {
      const payload = {
        subject: 'Test',
        body: 'Test',
      };

      const result = EmailPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should accept supplierEmail as alternative to to', () => {
      const payload = {
        supplierEmail: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      };

      const result = EmailPayloadSchema.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate email format', () => {
      const payload = {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      };

      const result = EmailPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should require subject', () => {
      const payload = {
        to: 'test@example.com',
        body: 'Test',
      };

      const result = EmailPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should require body', () => {
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
      };

      const result = EmailPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should validate items array', () => {
      const payload = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test',
        items: [
          { productName: 'Product', quantity: 10 },
          { productName: '', quantity: 5 }, // Invalid: empty name
        ],
      };

      const result = EmailPayloadSchema.safeParse(payload);
      // Should fail due to invalid item
      expect(result.success).toBe(false);
    });
  });

  describe('validateEmailRequest', () => {
    it('should return validated payload', () => {
      const input = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      };

      const result = validateEmailRequest(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.to).toBe('test@example.com');
      }
    });

    it('should normalize supplierEmail to to', () => {
      const input = {
        supplierEmail: 'test@example.com',
        subject: 'Test',
        body: 'Test',
      };

      const result = validateEmailRequest(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.to).toBe('test@example.com');
      }
    });

    it('should return error for invalid input', () => {
      const input = {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test',
      };

      const result = validateEmailRequest(input);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeTruthy();
      }
    });

    it('should handle missing required fields', () => {
      const input = {
        to: 'test@example.com',
        // Missing subject and body
      };

      const result = validateEmailRequest(input);
      expect(result.ok).toBe(false);
    });
  });
});

