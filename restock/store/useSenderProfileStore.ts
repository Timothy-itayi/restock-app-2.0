import { create } from 'zustand';
import { getSenderProfile, setSenderProfile as saveSenderProfileToStorage, type SenderProfile } from '../lib/helpers/storage/sender';

type SenderProfileStore = {
  senderProfile: SenderProfile | null;
  isHydrated: boolean;
  setSenderProfile: (senderProfile: SenderProfile) => void;
  updateProfile: (updates: Partial<SenderProfile>) => void;
  loadProfileFromStorage: () => Promise<void>;
  saveProfileToStorage: () => Promise<void>;
  clearProfile: () => void;
};

export const useSenderProfileStore = create<SenderProfileStore>((set, get) => ({
  senderProfile: null,
  isHydrated: false,
  
  setSenderProfile: (senderProfile) => {
    set({ senderProfile });
    // Auto-save to storage when profile is set
    saveSenderProfileToStorage(senderProfile).catch(console.warn);
  },
  
  updateProfile: (updates) => {
    const current = get().senderProfile;
    if (!current) {
      // If no profile exists, create one with updates
      const newProfile: SenderProfile = {
        name: updates.name || '',
        email: updates.email || '',
        storeName: updates.storeName || null,
      };
      get().setSenderProfile(newProfile);
    } else {
      const updated = { ...current, ...updates };
      get().setSenderProfile(updated);
    }
  },
  
  loadProfileFromStorage: async () => {
    const profile = await getSenderProfile();
    set({ senderProfile: profile, isHydrated: true });
  },
  
  saveProfileToStorage: async () => {
    const profile = get().senderProfile;
    if (profile) {
      await saveSenderProfileToStorage(profile);
    }
  },
  
  clearProfile: () => {
    set({ senderProfile: null });
  },
}));

// Convenience hook for accessing sender profile
export const useSenderProfile = () => {
  return useSenderProfileStore((state) => state.senderProfile);
};

// Hook to check if profile is loaded
export const useSenderProfileHydrated = () => {
  return useSenderProfileStore((state) => state.isHydrated);
};