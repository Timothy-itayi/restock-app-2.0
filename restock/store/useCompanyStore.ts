import { create } from 'zustand';
import { 
  getCompanyLink, 
  setCompanyLink, 
  getCachedSnapshots, 
  setCachedSnapshots,
  type CompanyLink 
} from '../lib/helpers/storage/company';
import * as api from '../lib/api/company';
import { useSessionStore } from './useSessionStore';
import { useSupplierStore } from './useSupplierStore';

type CompanyStore = {
  link: CompanyLink | null;
  cachedSnapshots: Record<string, api.Snapshot>;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadFromStorage: () => Promise<void>;
  createCompany: (storeName: string) => Promise<void>;
  joinCompany: (code: string, storeName: string) => Promise<void>;
  leaveCompany: () => Promise<void>;
  publishSnapshot: () => Promise<void>;
  getStores: () => Promise<string[]>;
  getSnapshot: (storeName: string) => Promise<api.Snapshot>;
};

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  link: null,
  cachedSnapshots: {},
  isHydrated: false,
  isLoading: false,
  error: null,

  loadFromStorage: async () => {
    const [link, cachedSnapshots] = await Promise.all([
      getCompanyLink(),
      getCachedSnapshots()
    ]);
    set({ link, cachedSnapshots, isHydrated: true });
  },

  createCompany: async (storeName: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.createOrg(storeName);
      const link: CompanyLink = {
        code: data.code,
        orgId: data.orgId,
        storeName,
        joinedAt: Date.now()
      };
      await setCompanyLink(link);
      set({ link, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  joinCompany: async (code: string, storeName: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.joinOrg(code, storeName);
      const link: CompanyLink = {
        code,
        orgId: data.orgId,
        storeName,
        joinedAt: Date.now()
      };
      await setCompanyLink(link);
      set({ link, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  leaveCompany: async () => {
    await setCompanyLink(null);
    set({ link: null, cachedSnapshots: {} });
    await setCachedSnapshots({});
  },

  publishSnapshot: async () => {
    const { link } = get();
    if (!link) return;

    set({ isLoading: true, error: null });
    try {
      const sessions = useSessionStore.getState().sessions;
      const suppliers = useSupplierStore.getState().suppliers;
      
      const snapshot = {
        storeName: link.storeName,
        sessions: sessions.filter(s => s.status === 'completed'),
        suppliers
      };

      await api.publishSnapshot(link.code, link.storeName, snapshot);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  getStores: async () => {
    const { link } = get();
    if (!link) return [];
    return api.fetchStores(link.code);
  },

  getSnapshot: async (storeName: string) => {
    const { link, cachedSnapshots } = get();
    if (!link) throw new Error('Not linked to a company');

    try {
      const snapshot = await api.fetchSnapshot(link.code, storeName);
      const updatedCache = { ...cachedSnapshots, [storeName]: snapshot };
      set({ cachedSnapshots: updatedCache });
      await setCachedSnapshots(updatedCache);
      return snapshot;
    } catch (err: any) {
      // Return cached if available
      if (cachedSnapshots[storeName]) {
        return cachedSnapshots[storeName];
      }
      throw err;
    }
  }
}));

