/**
 * Tests for Send Email API
 * @file tests/api/sendEmail.test.ts
 */
import { isValidEmail, generateEmailBody, sendEmail } from '../../lib/api/sendEmail';

// Mock fetch globally
global.fetch = jest.fn();

// Mock deviceId
jest.mock('../../lib/utils/deviceId', () => ({
  getDeviceId: jest.fn().mockResolvedValue('test-device-id'),
}));

describe('sendEmail API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
      expect(isValidEmail('user_name@example-domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });
  });

  describe('generateEmailBody', () => {
    it('should generate email body with items list', async () => {
      const result = await generateEmailBody(
        'Test Supplier',
        [
          { productName: 'Product A', quantity: 5 },
          { productName: 'Product B', quantity: 10 },
        ],
        'Test Sender',
        'Test Store'
      );

      expect(result).toContain('Test Supplier');
      expect(result).toContain('Product A');
      expect(result).toContain('Product B');
      expect(result).toContain('Qty: 5');
      expect(result).toContain('Qty: 10');
      expect(result).toContain('Test Sender');
      expect(result).toContain('Test Store');
    });

    it('should generate email body without store name', async () => {
      const result = await generateEmailBody(
        'Test Supplier',
        [{ productName: 'Product A', quantity: 1 }],
        'Test Sender'
      );

      expect(result).toContain('Test Supplier');
      expect(result).toContain('Test Sender');
      expect(result).not.toContain('undefined');
    });

    it('should handle empty items list', async () => {
      const result = await generateEmailBody(
        'Test Supplier',
        [],
        'Test Sender'
      );

      expect(result).toContain('Test Supplier');
      expect(result).toContain('Test Sender');
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          messageId: 'resend_123',
        }),
      });

      const result = await sendEmail({
        to: 'supplier@example.com',
        replyTo: 'sender@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('restock-send-email'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should validate email format before sending', async () => {
      const result = await sendEmail({
        to: 'invalid-email',
        replyTo: 'sender@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_EMAIL');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should validate reply-to email format', async () => {
      const result = await sendEmail({
        to: 'supplier@example.com',
        replyTo: 'invalid-email',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_REPLY_TO');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await sendEmail({
        to: 'supplier@example.com',
        replyTo: 'sender@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('NETWORK_ERROR');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Bad Request' }),
      });

      const result = await sendEmail({
        to: 'supplier@example.com',
        replyTo: 'sender@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
    });

    it('should handle invalid JSON response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await sendEmail({
        to: 'supplier@example.com',
        replyTo: 'sender@example.com',
        subject: 'Test',
        text: 'Test',
      });

      expect(result.success).toBe(false);
    });
  });
});
