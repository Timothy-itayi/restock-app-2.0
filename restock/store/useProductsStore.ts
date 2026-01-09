import { create } from 'zustand';
import { getVersionedJSON, setVersionedJSON } from '../lib/helpers/storage/utils';
import logger from '../lib/helpers/logger';

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
      setVersionedJSON(STORAGE_KEY, newList).catch(err => logger.error('Failed to save products after update', err));

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
    setVersionedJSON(STORAGE_KEY, merged).catch(err => logger.error('Failed to save products after add', err));

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
    try {
      const products = await getVersionedJSON<ProductHistory[]>(
        STORAGE_KEY,
        (oldVersion, oldData) => {
          // Migration function: ensure array format
          if (oldVersion === 0 || oldVersion === 1) {
            return Array.isArray(oldData) ? oldData : [];
          }
          return null;
        }
      );
      
      const validProducts = Array.isArray(products) ? products : [];
      set({ products: validProducts, isHydrated: true });
    } catch (error) {
      logger.error('Failed to load products from storage', error);
      set({ products: [], isHydrated: true });
    }
  },

  //------------------------------------------------------------------
  // SAVE
  //------------------------------------------------------------------
  saveProducts: async () => {
    try {
      await setVersionedJSON(STORAGE_KEY, get().products);
    } catch (err) {
      logger.error('Failed to save products to storage', err);
    }
  }
}));
