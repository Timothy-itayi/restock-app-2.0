/**
 * Test setup for backend tests
 * Configures test environment for Cloudflare Workers
 */

// Mock fetch for testing
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

