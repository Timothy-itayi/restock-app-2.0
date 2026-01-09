/**
 * Tests for Supplier Store (Zustand)
 * @file tests/stores/useSupplierStore.test.ts
 */
import { useSupplierStore } from '../../store/useSupplierStore';
import { getVersionedJSON, setVersionedJSON } from '../../lib/helpers/storage/utils';

// Mock the storage utils
jest.mock('../../lib/helpers/storage/utils', () => ({
  getVersionedJSON: jest.fn(),
  setVersionedJSON: jest.fn().mockResolvedValue(undefined),
}));

describe('useSupplierStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSupplierStore.setState({ suppliers: [], isHydrated: false });
    jest.clearAllMocks();
  });

  describe('addSupplier', () => {
    it('should add a new supplier and persist', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Test Supplier', 'test@example.com');

      expect(supplier.name).toBe('Test Supplier');
      expect(supplier.email).toBe('test@example.com');
      expect(useSupplierStore.getState().suppliers).toContainEqual(supplier);
      expect(setVersionedJSON).toHaveBeenCalledWith(
        expect.any(String),
        [supplier]
      );
    });
  });

  describe('updateSupplier', () => {
    it('should update existing supplier and persist', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Old Name');
      store.updateSupplier(supplier.id, { name: 'New Name' });

      const updated = useSupplierStore.getState().suppliers[0];
      expect(updated.name).toBe('New Name');
      expect(setVersionedJSON).toHaveBeenLastCalledWith(
        expect.any(String),
        [updated]
      );
    });
  });

  describe('deleteSupplier', () => {
    it('should remove supplier and persist', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('To Delete');
      store.deleteSupplier(supplier.id);

      expect(useSupplierStore.getState().suppliers).toEqual([]);
      expect(setVersionedJSON).toHaveBeenLastCalledWith(
        expect.any(String),
        []
      );
    });
  });

  describe('deleteAllSuppliers', () => {
    it('should clear all suppliers and persist', () => {
      const store = useSupplierStore.getState();
      store.addSupplier('Supplier 1');
      store.addSupplier('Supplier 2');
      store.deleteAllSuppliers();

      expect(useSupplierStore.getState().suppliers).toEqual([]);
      expect(setVersionedJSON).toHaveBeenLastCalledWith(
        expect.any(String),
        []
      );
    });
  });

  describe('getSupplierByName', () => {
    it('should return supplier by name (case-insensitive)', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Coca-Cola');
      
      expect(store.getSupplierByName('coca-cola')).toEqual(supplier);
      expect(store.getSupplierByName('COCA-COLA')).toEqual(supplier);
    });
  });

  describe('loadSuppliers', () => {
    it('should load suppliers from storage and update state', async () => {
      const mockSuppliers = [
        { id: '1', name: 'Supplier A' }
      ];
      (getVersionedJSON as jest.Mock).mockResolvedValue(mockSuppliers);
      
      const store = useSupplierStore.getState();
      await store.loadSuppliers();
      
      expect(useSupplierStore.getState().suppliers).toEqual(mockSuppliers);
      expect(useSupplierStore.getState().isHydrated).toBe(true);
    });

    it('should handle empty storage', async () => {
      (getVersionedJSON as jest.Mock).mockResolvedValue(null);
      
      const store = useSupplierStore.getState();
      await store.loadSuppliers();
      
      expect(useSupplierStore.getState().suppliers).toEqual([]);
      expect(useSupplierStore.getState().isHydrated).toBe(true);
    });
  });
});

