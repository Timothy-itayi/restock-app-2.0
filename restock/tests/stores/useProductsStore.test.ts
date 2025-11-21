/**
 * Tests for Products Store (Zustand)
 * @file tests/stores/useProductsStore.test.ts
 */
import { useProductsStore } from '../../store/useProductsStore';
import type { ProductHistory } from '../../store/useProductsStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage - already mocked in setup.ts
jest.mock('@react-native-async-storage/async-storage');

describe('useProductsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useProductsStore.setState({ products: [], isHydrated: false });
  });

  describe('addOrUpdateProduct', () => {
    it('should add new product if not exists', () => {
      const store = useProductsStore.getState();
      const product = store.addOrUpdateProduct('New Product', 'supplier-1', 5);

      expect(product.name).toBe('New Product');
      expect(product.lastSupplierId).toBe('supplier-1');
      expect(product.lastQty).toBe(5);
    });

    it('should update existing product (case-insensitive)', () => {
      const store = useProductsStore.getState();
      store.addOrUpdateProduct('Product A', 'supplier-1', 5);
      const updated = store.addOrUpdateProduct('product a', 'supplier-2', 10);

      const products = useProductsStore.getState().products;
      expect(products.length).toBe(1);
      expect(updated.lastSupplierId).toBe('supplier-2');
      expect(updated.lastQty).toBe(10);
    });

    it('should preserve existing values when updating with undefined', () => {
      const store = useProductsStore.getState();
      store.addOrUpdateProduct('Product A', 'supplier-1', 5);
      const updated = store.addOrUpdateProduct('Product A', undefined, undefined);

      expect(updated.lastSupplierId).toBe('supplier-1');
      expect(updated.lastQty).toBe(5);
    });
  });

  describe('getProduct', () => {
    it('should find product by name (case-insensitive)', () => {
      const store = useProductsStore.getState();
      store.addOrUpdateProduct('Product A');

      const found1 = store.getProduct('Product A');
      const found2 = store.getProduct('product a');
      const found3 = store.getProduct('  PRODUCT A  ');

      expect(found1?.name).toBe('Product A');
      expect(found2?.name).toBe('Product A');
      expect(found3?.name).toBe('Product A');
    });

    it('should return undefined for non-existent product', () => {
      const store = useProductsStore.getState();
      const found = store.getProduct('Non-existent');

      expect(found).toBeUndefined();
    });
  });

  describe('loadProducts', () => {
    it('should load products from storage', async () => {
      const mockProducts: ProductHistory[] = [
        { id: '1', name: 'Product A', lastSupplierId: 'supplier-1', lastQty: 5 }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockProducts })
      );

      const store = useProductsStore.getState();
      await store.loadProducts();

      const products = useProductsStore.getState().products;
      expect(products).toEqual(mockProducts);
    });
  });

  describe('saveProducts', () => {
    it('should save products to storage with version', async () => {
      const store = useProductsStore.getState();
      store.addOrUpdateProduct('Test Product');
      await store.saveProducts();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
