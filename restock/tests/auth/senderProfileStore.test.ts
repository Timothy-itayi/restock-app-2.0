/**
 * Tests for Sender Profile Store (Zustand)
 * @file tests/auth/senderProfileStore.test.ts
 */
import { useSenderProfileStore } from '../../store/useSenderProfileStore';
import { getVersionedJSON, setVersionedJSON } from '../../lib/helpers/storage/utils';

// Mock the storage utils
jest.mock('../../lib/helpers/storage/utils', () => ({
  getVersionedJSON: jest.fn(),
  setVersionedJSON: jest.fn().mockResolvedValue(undefined),
}));

describe('useSenderProfileStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSenderProfileStore.setState({ senderProfile: null, isHydrated: false });
  });

  describe('setSenderProfile', () => {
    it('should set sender profile and persist', () => {
      const store = useSenderProfileStore.getState();
      const profile = {
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      };

      store.setSenderProfile(profile);
      const state = useSenderProfileStore.getState();

      expect(state.senderProfile).toEqual(profile);
      expect(setVersionedJSON).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile fields and persist', () => {
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
      expect(setVersionedJSON).toHaveBeenCalledTimes(2);
    });
  });

  describe('loadProfileFromStorage', () => {
    it('should load profile from storage', async () => {
      const mockProfile = {
        name: 'Test User',
        email: 'test@example.com',
        storeName: 'Test Store'
      };

      (getVersionedJSON as jest.Mock).mockResolvedValue(mockProfile);

      const store = useSenderProfileStore.getState();
      await store.loadProfileFromStorage();

      const state = useSenderProfileStore.getState();
      expect(state.senderProfile).toEqual(mockProfile);
      expect(state.isHydrated).toBe(true);
    });

    it('should handle empty storage', async () => {
      (getVersionedJSON as jest.Mock).mockResolvedValue(null);

      const store = useSenderProfileStore.getState();
      await store.loadProfileFromStorage();

      const state = useSenderProfileStore.getState();
      expect(state.senderProfile).toBeNull();
      expect(state.isHydrated).toBe(true);
    });
  });

  describe('saveProfileToStorage', () => {
    it('should save profile to storage', async () => {
      const store = useSenderProfileStore.getState();
      const profile = {
        name: 'Test User',
        email: 'test@example.com'
      };
      store.setSenderProfile(profile);

      await store.saveProfileToStorage();

      expect(setVersionedJSON).toHaveBeenLastCalledWith(
        expect.any(String),
        profile
      );
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
