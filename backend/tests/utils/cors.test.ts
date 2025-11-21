/**
 * Tests for CORS utilities
 */

import { describe, it, expect } from 'vitest';
import { handleCorsPreflight, withCors, corsJson } from '../../shared/utils/cors';

describe('CORS utilities', () => {
  describe('handleCorsPreflight', () => {
    it('should return 204 with CORS headers', () => {
      const response = handleCorsPreflight();
      
      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should respect custom options', () => {
      const response = handleCorsPreflight({
        origin: 'https://example.com',
        methods: ['GET'],
      });
      
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
    });
  });

  describe('withCors', () => {
    it('should add CORS headers to existing response', () => {
      const originalResponse = new Response('test', { status: 200 });
      const corsResponse = withCors(originalResponse);
      
      expect(corsResponse.status).toBe(200);
      expect(corsResponse.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should preserve original response body', async () => {
      const originalResponse = new Response('test body', { status: 200 });
      const corsResponse = withCors(originalResponse);
      
      expect(await corsResponse.text()).toBe('test body');
    });
  });

  describe('corsJson', () => {
    it('should create JSON response with CORS headers', async () => {
      const data = { test: 'value' };
      const response = corsJson(data, 200);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      
      const json = await response.json();
      expect(json).toEqual(data);
    });

    it('should use custom status code', () => {
      const response = corsJson({}, 201);
      expect(response.status).toBe(201);
    });
  });
});

