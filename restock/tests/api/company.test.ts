/**
 * Tests for Company API
 * @file tests/api/company.test.ts
 */
import { 
  createOrg, 
  joinOrg, 
  fetchStores, 
  publishSnapshot, 
  fetchSnapshot 
} from '../../lib/api/company';
import Config from '../../lib/config';

// Mock fetch globally
global.fetch = jest.fn();

describe('Company API', () => {
  const BASE_URL = Config.COMPANY_API_URL;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createOrg', () => {
    it('should create organization successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orgId: 'org-123',
          code: 'CODE123',
          stores: ['Store A'],
        }),
      });

      const result = await createOrg('Store A');

      expect(result.orgId).toBe('org-123');
      expect(result.code).toBe('CODE123');
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/org`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ storeName: 'Store A' }),
        })
      );
    });

    it('should throw error on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Already exists' }),
      });

      await expect(createOrg('Store A')).rejects.toThrow('Already exists');
    });
  });

  describe('joinOrg', () => {
    it('should join organization successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orgId: 'org-123',
          stores: ['Store A', 'Store B'],
        }),
      });

      const result = await joinOrg('CODE123', 'Store B');

      expect(result.orgId).toBe('org-123');
      expect(result.stores).toContain('Store B');
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/org/join`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'CODE123', storeName: 'Store B' }),
        })
      );
    });
  });

  describe('fetchStores', () => {
    it('should fetch stores for a code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          orgId: 'org-123',
          stores: ['Store 1', 'Store 2'],
        }),
      });

      const stores = await fetchStores('CODE123');

      expect(stores).toEqual(['Store 1', 'Store 2']);
      expect(global.fetch).toHaveBeenCalledWith(`${BASE_URL}/org/CODE123/stores`);
    });
  });

  describe('publishSnapshot', () => {
    it('should publish snapshot successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });

      const snapshot = { sessions: [], suppliers: [] };
      await publishSnapshot('CODE123', 'Store A', snapshot);

      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/snapshot`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ code: 'CODE123', storeName: 'Store A', snapshot }),
        })
      );
    });
  });

  describe('fetchSnapshot', () => {
    it('should fetch snapshot for a store', async () => {
      const mockSnapshot = {
        storeName: 'Store A',
        publishedAt: 123456789,
        sessions: [],
        suppliers: [],
      };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSnapshot,
      });

      const result = await fetchSnapshot('CODE123', 'Store A');

      expect(result).toEqual(mockSnapshot);
      expect(global.fetch).toHaveBeenCalledWith(
        `${BASE_URL}/snapshot/CODE123/Store%20A`
      );
    });
  });
});

