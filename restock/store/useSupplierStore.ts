import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getVersionedJSON, setVersionedJSON } from '../lib/helpers/storage/utils';

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
  getSupplierByName: (name: string) => Supplier | undefined;

  loadSuppliers: () => Promise<void>;
  saveSuppliers: () => Promise<void>;
};

const STORAGE_KEY = 'suppliers';

export const useSupplierStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  isHydrated: false,

  //------------------------------------------------------------------
  // CREATE
  //------------------------------------------------------------------
  addSupplier: (name, email) => {
    const normalised = name.trim();
    const newSupplier: Supplier = {
      id: Date.now().toString() + '-' + Math.random(),
      name: normalised,
      email
    };

    const currentSuppliers = get().suppliers || [];
    const updated = [...currentSuppliers, newSupplier];

    set({ suppliers: updated });
    setVersionedJSON(STORAGE_KEY, updated).catch(console.warn);

    return newSupplier;
  },

  //------------------------------------------------------------------
  // UPDATE
  //------------------------------------------------------------------
  updateSupplier: (id, updates) => {
    const currentSuppliers = get().suppliers || [];
    const updated = currentSuppliers.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );

    set({ suppliers: updated });
    setVersionedJSON(STORAGE_KEY, updated).catch(console.warn);
  },

  //------------------------------------------------------------------
  // DELETE
  //------------------------------------------------------------------
  deleteSupplier: (id) => {
    const currentSuppliers = get().suppliers || [];
    const updated = currentSuppliers.filter(s => s.id !== id);

    set({ suppliers: updated });
    setVersionedJSON(STORAGE_KEY, updated).catch(console.warn);
  },

  //------------------------------------------------------------------
  // FIND BY NAME (case-insensitive)
  //------------------------------------------------------------------
  getSupplierByName: (name) => {
    const currentSuppliers = get().suppliers || [];
    if (currentSuppliers.length === 0) return undefined;
    
    const target = name.trim().toLowerCase();
    return currentSuppliers.find(
      s => s.name.trim().toLowerCase() === target
    );
  },

  //------------------------------------------------------------------
  // LOAD
  //------------------------------------------------------------------
  loadSuppliers: async () => {
    try {
      const suppliers = await getVersionedJSON<Supplier[]>(
        STORAGE_KEY,
        (oldVersion, oldData) => {
          // Migration function: ensure array format
          if (oldVersion === 0 || oldVersion === 1) {
            return Array.isArray(oldData) ? oldData : [];
          }
          return null;
        }
      );
      
      // Ensure we have an array
      const validSuppliers = Array.isArray(suppliers) ? suppliers : [];
      set({ suppliers: validSuppliers, isHydrated: true });
    } catch (error) {
      console.warn('Failed to load suppliers:', error);
      // Initialize with empty array on error
      set({ suppliers: [], isHydrated: true });
    }
  },

  //------------------------------------------------------------------
  // SAVE
  //------------------------------------------------------------------
  saveSuppliers: async () => {
    const currentSuppliers = get().suppliers || [];
    await setVersionedJSON(STORAGE_KEY, currentSuppliers);
  }
}));
