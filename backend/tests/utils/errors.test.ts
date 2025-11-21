/**
 * Tests for error utilities
 */

import { describe, it, expect } from 'vitest';
import { createError, createSuccess, sanitizeError } from '../../shared/utils/errors';

describe('Error utilities', () => {
  describe('createError', () => {
    it('should create error response with correct format', async () => {
      const { response, status } = createError('Test error', 400);
      
      expect(status).toBe(400);
      const json = await response.json();
      expect(json).toEqual({
        success: false,
        error: 'CLIENT_ERROR',
        message: 'Test error',
      });
    });

    it('should use custom error code', async () => {
      const { response } = createError('Test error', 400, 'CUSTOM_ERROR');
      const json = await response.json();
      expect(json.error).toBe('CUSTOM_ERROR');
    });

    it('should map 5xx to SERVER_ERROR', async () => {
      const { response } = createError('Server error', 500);
      const json = await response.json();
      expect(json.error).toBe('SERVER_ERROR');
    });
  });

  describe('createSuccess', () => {
    it('should create success response', async () => {
      const response = createSuccess({ test: 'value' });
      
      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json).toEqual({
        success: true,
        data: { test: 'value' },
      });
    });

    it('should include extra fields', async () => {
      const response = createSuccess(undefined, 200, { messageId: '123' });
      const json = await response.json();
      expect(json.messageId).toBe('123');
    });

    it('should omit data if undefined', async () => {
      const response = createSuccess(undefined);
      const json = await response.json();
      expect(json).not.toHaveProperty('data');
    });
  });

  describe('sanitizeError', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Test error');
      expect(sanitizeError(error)).toBe('Test error');
    });

    it('should return string as-is', () => {
      expect(sanitizeError('String error')).toBe('String error');
    });

    it('should handle unknown error types', () => {
      expect(sanitizeError({})).toBe('An unexpected error occurred');
    });
  });
});

