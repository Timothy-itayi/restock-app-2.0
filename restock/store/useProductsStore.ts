import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ProductHistory = {
  id: string;
  name: string;
  lastSupplierId?: string;
  lastQty?: number;
};

type ProductStore = {
  products: ProductHistory[];
  isHydrated: boolean;

  addOrUpdateProduct: (name: string, supplierId?: string, qty?: number) => ProductHistory;
  getProduct: (name: string) => ProductHistory | undefined;

  loadProducts: () => Promise<void>;
  saveProducts: () => Promise<void>;
};

const STORAGE_KEY = 'products';

export const useProductsStore = create<ProductStore>((set, get) => ({
  products: [],
  isHydrated: false,

  //------------------------------------------------------------------
  // UPSERT
  //------------------------------------------------------------------
  addOrUpdateProduct: (name, supplierId, qty) => {
    const normalised = name.trim().toLowerCase();
    const existing = get().products.find(
      p => p.name.trim().toLowerCase() === normalised
    );

    if (existing) {
      const updated = {
        ...existing,
        lastSupplierId: supplierId ?? existing.lastSupplierId,
        lastQty: qty ?? existing.lastQty
      };

      const newList = get().products.map(p =>
        p.id === existing.id ? updated : p
      );

      set({ products: newList });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList)).catch(console.warn);

      return updated;
    }

    const newProd: ProductHistory = {
      id: Date.now().toString() + '-' + Math.random(),
      name,
      lastSupplierId: supplierId,
      lastQty: qty
    };

    const merged = [...get().products, newProd];

    set({ products: merged });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged)).catch(console.warn);

    return newProd;
  },

  //------------------------------------------------------------------
  // GET BY NAME
  //------------------------------------------------------------------
  getProduct: (name) => {
    const normalised = name.trim().toLowerCase();
    return get().products.find(
      p => p.name.trim().toLowerCase() === normalised
    );
  },

  //------------------------------------------------------------------
  // LOAD
  //------------------------------------------------------------------
  loadProducts: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const products = raw ? JSON.parse(raw) : [];
    set({ products, isHydrated: true });
  },

  //------------------------------------------------------------------
  // SAVE
  //------------------------------------------------------------------
  saveProducts: async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().products));
  }
}));
