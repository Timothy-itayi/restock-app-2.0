/**
 * Tests for Products Store (Zustand)
 * @file tests/stores/useProductsStore.test.ts
 */
import { useProductsStore } from '../../store/useProductsStore';
import type { ProductHistory } from '../../store/useProductsStore';
import { getVersionedJSON, setVersionedJSON } from '../../lib/helpers/storage/utils';

// Mock the storage utils
jest.mock('../../lib/helpers/storage/utils', () => ({
  getVersionedJSON: jest.fn(),
  setVersionedJSON: jest.fn().mockResolvedValue(undefined),
}));

describe('useProductsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useProductsStore.setState({ products: [], isHydrated: false });
    jest.clearAllMocks();
  });

  describe('addOrUpdateProduct', () => {
    it('should add new product if not exists and persist', () => {
      const store = useProductsStore.getState();
      const product = store.addOrUpdateProduct('New Product', 'supplier-1', 5);

      expect(product.name).toBe('New Product');
      expect(product.lastSupplierId).toBe('supplier-1');
      expect(product.lastQty).toBe(5);
      expect(setVersionedJSON).toHaveBeenCalled();
    });

    it('should update existing product (case-insensitive) and persist', () => {
      const store = useProductsStore.getState();
      store.addOrUpdateProduct('Product A', 'supplier-1', 5);
      const updated = store.addOrUpdateProduct('product a', 'supplier-2', 10);

      const products = useProductsStore.getState().products;
      expect(products.length).toBe(1);
      expect(updated.lastSupplierId).toBe('supplier-2');
      expect(updated.lastQty).toBe(10);
      expect(setVersionedJSON).toHaveBeenCalledTimes(2);
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
    it('should load products from storage and update state', async () => {
      const mockProducts: ProductHistory[] = [
        { id: '1', name: 'Product A', lastSupplierId: 'supplier-1', lastQty: 5 }
      ];
      (getVersionedJSON as jest.Mock).mockResolvedValue(mockProducts);
      
      const store = useProductsStore.getState();
      await store.loadProducts();
      
      expect(useProductsStore.getState().products).toEqual(mockProducts);
      expect(useProductsStore.getState().isHydrated).toBe(true);
    });

    it('should handle empty storage', async () => {
      (getVersionedJSON as jest.Mock).mockResolvedValue(null);
      
      const store = useProductsStore.getState();
      await store.loadProducts();
      
      expect(useProductsStore.getState().products).toEqual([]);
      expect(useProductsStore.getState().isHydrated).toBe(true);
    });
  });

  describe('saveProducts', () => {
    it('should save products to storage', async () => {
      const store = useProductsStore.getState();
      store.addOrUpdateProduct('Test Product');
      await store.saveProducts();

      expect(setVersionedJSON).toHaveBeenLastCalledWith(
        expect.any(String),
        useProductsStore.getState().products
      );
    });
  });
});
