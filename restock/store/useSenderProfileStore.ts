import { create } from 'zustand';
import {
  getSenderProfile,
  setSenderProfile as saveSenderProfileToStorage,
  type SenderProfile
} from '../lib/helpers/storage/sender';

type SenderProfileStore = {
  senderProfile: SenderProfile | null;
  isHydrated: boolean;

  // CRUD actions
  setSenderProfile: (profile: SenderProfile) => void;
  updateProfile: (updates: Partial<SenderProfile>) => void;

  // Persistence
  loadProfileFromStorage: () => Promise<void>;
  saveProfileToStorage: () => Promise<void>;

  clearProfile: () => void;
};

export const useSenderProfileStore = create<SenderProfileStore>((set, get) => ({
  senderProfile: null,
  isHydrated: false,

  //----------------------------------------------------------------------
  // SET PROFILE — does NOT auto-save (prevents render/write loops)
  //----------------------------------------------------------------------
  setSenderProfile: (profile) => {
    set({ senderProfile: profile });
  },

  //----------------------------------------------------------------------
  // UPDATE PROFILE — updates in memory only. Save explicitly later.
  //----------------------------------------------------------------------
  updateProfile: (updates) => {
    const current = get().senderProfile;
    const updated: SenderProfile = {
      name: updates.name ?? current?.name ?? '',
      email: updates.email ?? current?.email ?? '',
      storeName: updates.storeName ?? current?.storeName ?? null,
    };
    set({ senderProfile: updated });
  },

  //----------------------------------------------------------------------
  // LOAD PROFILE FROM STORAGE
  //----------------------------------------------------------------------
  loadProfileFromStorage: async () => {
    const profile = await getSenderProfile();
    set({ senderProfile: profile, isHydrated: true });
  },

  //----------------------------------------------------------------------
  // SAVE PROFILE EXPLICITLY
  //----------------------------------------------------------------------
  saveProfileToStorage: async () => {
    const profile = get().senderProfile;
    if (profile) {
      await saveSenderProfileToStorage(profile);
    }
  },

  //----------------------------------------------------------------------
  // RESET
  //----------------------------------------------------------------------
  clearProfile: () => {
    set({ senderProfile: null });
  },
}));

export const useSenderProfile = () =>
  useSenderProfileStore((s) => s.senderProfile);

export const useSenderProfileHydrated = () =>
  useSenderProfileStore((s) => s.isHydrated);
