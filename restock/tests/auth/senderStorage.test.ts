/**
 * Tests for Sender Profile Storage Helpers
 * @file tests/auth/senderStorage.test.ts
 */
import { getSenderProfile, setSenderProfile } from '../../lib/helpers/storage/sender';
import type { SenderProfile } from '../../lib/helpers/storage/sender';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage - already mocked in setup.ts
jest.mock('@react-native-async-storage/async-storage');

describe('Sender Profile Storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSenderProfile', () => {
    it('should return null when no profile exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const profile = await getSenderProfile();

      expect(profile).toBeNull();
    });

    it('should return profile from storage', async () => {
      const mockProfile: SenderProfile = {
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockProfile })
      );

      const profile = await getSenderProfile();

      expect(profile).toEqual(mockProfile);
    });

    it('should migrate unversioned data', async () => {
      const mockProfile: SenderProfile = {
        name: 'Test User',
        email: 'test@example.com'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify(mockProfile)
      );

      const profile = await getSenderProfile();

      expect(profile).toEqual(mockProfile);
      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should handle corrupted data gracefully', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');

      const profile = await getSenderProfile();

      expect(profile).toBeNull();
    });
  });

  describe('setSenderProfile', () => {
    it('should save profile with version metadata', async () => {
      const profile: SenderProfile = {
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      };

      await setSenderProfile(profile);

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const callArgs = (AsyncStorage.setItem as jest.Mock).mock.calls[0];
      const savedData = JSON.parse(callArgs[1]);
      
      expect(savedData.version).toBeDefined();
      expect(savedData.data).toEqual(profile);
    });

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Save failed'));

      const profile: SenderProfile = {
        name: 'Test User',
        email: 'test@example.com'
      };

      await expect(setSenderProfile(profile)).resolves.not.toThrow();
    });
  });
});
