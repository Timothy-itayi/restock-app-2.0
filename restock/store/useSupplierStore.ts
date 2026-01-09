import { create } from 'zustand';
import { getVersionedJSON, setVersionedJSON } from '../lib/helpers/storage/utils';
import logger from '../lib/helpers/logger';

export type Supplier = {
  id: string;
  name: string;
  email?: string;
};

type SupplierStore = {
  suppliers: Supplier[];
  isHydrated: boolean;

  addSupplier: (name: string, email?: string) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  deleteAllSuppliers: () => void;
  getSupplierByName: (name: string) => Supplier | undefined;

  loadSuppliers: () => Promise<void>;
};

const STORAGE_KEY = '@restock/suppliers-v1';

export const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  isHydrated: false,

  //------------------------------------------------------------------
  // CREATE
  //------------------------------------------------------------------
  addSupplier: (name, email) => {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      name,
      email,
    };

    const updated = [...get().suppliers, newSupplier];
    set({ suppliers: updated });
    setVersionedJSON(STORAGE_KEY, updated).catch(err => logger.error('Failed to save suppliers after add', err));

    return newSupplier;
  },

  //------------------------------------------------------------------
  // UPDATE
  //------------------------------------------------------------------
  updateSupplier: (id, updates) => {
    const currentSuppliers = get().suppliers || [];
    const updated = currentSuppliers.map(s => s.id === id ? { ...s, ...updates } : s);

    set({ suppliers: updated });
    setVersionedJSON(STORAGE_KEY, updated).catch(err => logger.error('Failed to save suppliers after update', err));
  },

  //------------------------------------------------------------------
  // DELETE
  //------------------------------------------------------------------
  deleteSupplier: (id) => {
    const currentSuppliers = get().suppliers || [];
    const updated = currentSuppliers.filter(s => s.id !== id);

    set({ suppliers: updated });
    setVersionedJSON(STORAGE_KEY, updated).catch(err => logger.error('Failed to save suppliers after delete', err));
  },

  deleteAllSuppliers: () => {
    set({ suppliers: [] });
    setVersionedJSON(STORAGE_KEY, []).catch(err => logger.error('Failed to save empty suppliers list', err));
  },

  //------------------------------------------------------------------
  // HELPER
  //------------------------------------------------------------------
  getSupplierByName: (name) => {
    const currentSuppliers = get().suppliers || [];
    return currentSuppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
  },

  //------------------------------------------------------------------
  // LOAD
  //------------------------------------------------------------------
  loadSuppliers: async () => {
    try {
      const saved = await getVersionedJSON<Supplier[]>(STORAGE_KEY);
      if (saved) {
        set({ suppliers: saved, isHydrated: true });
      } else {
        set({ isHydrated: true });
      }
    } catch (error) {
      logger.error('Failed to load suppliers from storage', error);
      set({ isHydrated: true });
    }
  },
}));

// Stable hooks
export const useSuppliers = () => useSupplierStore((state) => state.suppliers);
export const useSupplierHydrated = () => useSupplierStore((state) => state.isHydrated);
