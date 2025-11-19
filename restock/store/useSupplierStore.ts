import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);

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
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);
  },

  //------------------------------------------------------------------
  // DELETE
  //------------------------------------------------------------------
  deleteSupplier: (id) => {
    const currentSuppliers = get().suppliers || [];
    const updated = currentSuppliers.filter(s => s.id !== id);

    set({ suppliers: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);
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
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ suppliers: [], isHydrated: true });
        return;
      }
      
      const parsed = JSON.parse(raw);
      // Ensure we have an array
      const suppliers = Array.isArray(parsed) ? parsed : [];
      set({ suppliers, isHydrated: true });
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
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentSuppliers));
  }
}));
