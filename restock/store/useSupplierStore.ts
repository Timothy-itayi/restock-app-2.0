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

    const updated = [...get().suppliers, newSupplier];

    set({ suppliers: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);

    return newSupplier;
  },

  //------------------------------------------------------------------
  // UPDATE
  //------------------------------------------------------------------
  updateSupplier: (id, updates) => {
    const updated = get().suppliers.map(s =>
      s.id === id ? { ...s, ...updates } : s
    );

    set({ suppliers: updated });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(console.warn);
  },

  //------------------------------------------------------------------
  // FIND BY NAME (case-insensitive)
  //------------------------------------------------------------------
  getSupplierByName: (name) => {
    const target = name.trim().toLowerCase();
    return get().suppliers.find(
      s => s.name.trim().toLowerCase() === target
    );
  },

  //------------------------------------------------------------------
  // LOAD
  //------------------------------------------------------------------
  loadSuppliers: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const suppliers = raw ? JSON.parse(raw) : [];
    set({ suppliers, isHydrated: true });
  },

  //------------------------------------------------------------------
  // SAVE
  //------------------------------------------------------------------
  saveSuppliers: async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().suppliers));
  }
}));
