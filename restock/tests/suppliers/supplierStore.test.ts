/**
 * Tests for Supplier Store (Zustand)
 * @file tests/suppliers/supplierStore.test.ts
 */
import { useSupplierStore } from '../../store/useSupplierStore';
import type { Supplier } from '../../store/useSupplierStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage - already mocked in setup.ts
jest.mock('@react-native-async-storage/async-storage');

describe('useSupplierStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSupplierStore.setState({ suppliers: [], isHydrated: false });
  });

  describe('addSupplier', () => {
    it('should add a new supplier', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Test Supplier', 'test@example.com');

      expect(supplier.name).toBe('Test Supplier');
      expect(supplier.email).toBe('test@example.com');
      expect(typeof supplier.id).toBe('string');
    });

    it('should trim supplier name', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('  Test Supplier  ', 'test@example.com');

      expect(supplier.name).toBe('Test Supplier');
    });

    it('should add supplier to suppliers array', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Test Supplier');
      const suppliers = useSupplierStore.getState().suppliers;

      expect(suppliers).toContainEqual(supplier);
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier details', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Test Supplier');
      store.updateSupplier(supplier.id, { email: 'new@example.com' });

      const updated = useSupplierStore.getState().suppliers.find(s => s.id === supplier.id);
      expect(updated?.email).toBe('new@example.com');
      expect(updated?.name).toBe('Test Supplier');
    });
  });

  describe('deleteSupplier', () => {
    it('should remove supplier from array', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Test Supplier');
      store.deleteSupplier(supplier.id);

      const suppliers = useSupplierStore.getState().suppliers;
      expect(suppliers).not.toContainEqual(supplier);
    });
  });

  describe('getSupplierByName', () => {
    it('should find supplier by name (case-insensitive)', () => {
      const store = useSupplierStore.getState();
      const supplier = store.addSupplier('Test Supplier');

      const found1 = store.getSupplierByName('Test Supplier');
      const found2 = store.getSupplierByName('test supplier');
      const found3 = store.getSupplierByName('  TEST SUPPLIER  ');

      expect(found1).toEqual(supplier);
      expect(found2).toEqual(supplier);
      expect(found3).toEqual(supplier);
    });

    it('should return undefined for non-existent supplier', () => {
      const store = useSupplierStore.getState();
      const found = store.getSupplierByName('Non-existent');

      expect(found).toBeUndefined();
    });
  });

  describe('loadSuppliers', () => {
    it('should load suppliers from storage', async () => {
      const mockSuppliers: Supplier[] = [
        { id: '1', name: 'Test Supplier', email: 'test@example.com' }
      ];

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockSuppliers })
      );

      const store = useSupplierStore.getState();
      await store.loadSuppliers();

      const suppliers = useSupplierStore.getState().suppliers;
      expect(suppliers).toEqual(mockSuppliers);
    });

    it('should handle empty storage', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const store = useSupplierStore.getState();
      await store.loadSuppliers();

      const suppliers = useSupplierStore.getState().suppliers;
      expect(suppliers).toEqual([]);
    });
  });

  describe('saveSuppliers', () => {
    it('should save suppliers to storage with version', async () => {
      const store = useSupplierStore.getState();
      store.addSupplier('Test Supplier');
      await store.saveSuppliers();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });
});
