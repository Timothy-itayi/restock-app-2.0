/**
 * Tests for Sender Profile Store (Zustand)
 * @file tests/auth/senderProfileStore.test.ts
 */
import { useSenderProfileStore } from '../../store/useSenderProfileStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage - already mocked in setup.ts
jest.mock('@react-native-async-storage/async-storage');

describe('useSenderProfileStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSenderProfileStore.setState({ senderProfile: null, isHydrated: false });
  });

  describe('setSenderProfile', () => {
    it('should set sender profile', () => {
      const store = useSenderProfileStore.getState();
      const profile = {
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      };

      store.setSenderProfile(profile);
      const state = useSenderProfileStore.getState();

      expect(state.senderProfile).toEqual(profile);
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields', () => {
      const store = useSenderProfileStore.getState();
      store.setSenderProfile({
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      });

      store.updateProfile({ email: 'new@example.com' });
      const state = useSenderProfileStore.getState();

      expect(state.senderProfile?.email).toBe('new@example.com');
      expect(state.senderProfile?.name).toBe('Test User');
    });
  });

  describe('loadProfileFromStorage', () => {
    it('should load profile from storage', async () => {
      const mockProfile = {
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockProfile })
      );

      const store = useSenderProfileStore.getState();
      await store.loadProfileFromStorage();

      const state = useSenderProfileStore.getState();
      expect(state.senderProfile).toEqual(mockProfile);
      expect(state.isHydrated).toBe(true);
    });

    it('should handle empty storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const store = useSenderProfileStore.getState();
      await store.loadProfileFromStorage();

      const state = useSenderProfileStore.getState();
      expect(state.senderProfile).toBeNull();
      expect(state.isHydrated).toBe(true);
    });
  });

  describe('saveProfileToStorage', () => {
    it('should save profile to storage with version', async () => {
      const store = useSenderProfileStore.getState();
      store.setSenderProfile({
        name: 'Test User',
        email: 'test@example.com'
      });

      await store.saveProfileToStorage();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('clearProfile', () => {
    it('should clear sender profile', () => {
      const store = useSenderProfileStore.getState();
      store.setSenderProfile({
        name: 'Test User',
        email: 'test@example.com'
      });

      store.clearProfile();
      const state = useSenderProfileStore.getState();

      expect(state.senderProfile).toBeNull();
    });
  });
});
