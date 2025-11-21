/**
 * Tests for Cross-Store Validation Hook
 * @file tests/hooks/useCrossStoreValidation.test.ts
 */
import {
  validateCrossStoreRelationships,
  validateSessionItemSupplier
} from '../../lib/hooks/useCrossStoreValidation';
import { useSessionStore } from '../../store/useSessionStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import { useProductsStore } from '../../store/useProductsStore';
import type { SessionItem } from '../../lib/helpers/storage/sessions';

describe('Cross-Store Validation', () => {
  beforeEach(() => {
    // Reset all stores
    useSessionStore.setState({ sessions: [], isHydrated: true });
    useSupplierStore.setState({ suppliers: [], isHydrated: true });
    useProductsStore.setState({ products: [], isHydrated: true });
  });

  describe('validateCrossStoreRelationships', () => {
    it('should return valid when all references exist', () => {
      const supplierStore = useSupplierStore.getState();
      const supplier = supplierStore.addSupplier('Test Supplier', 'test@example.com');

      const sessionStore = useSessionStore.getState();
      const session = sessionStore.createSession();
      sessionStore.addItemToSession(session.id, {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierId: supplier.id
      });

      const result = validateCrossStoreRelationships();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect orphaned supplier IDs in session items', () => {
      const sessionStore = useSessionStore.getState();
      const session = sessionStore.createSession();
      sessionStore.addItemToSession(session.id, {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierId: 'non-existent-id'
      });

      const result = validateCrossStoreRelationships();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('orphaned_supplier_id');
    });

    it('should detect orphaned supplier IDs in product history', () => {
      const productStore = useProductsStore.getState();
      productStore.addOrUpdateProduct('Test Product', 'non-existent-id', 5);

      const result = validateCrossStoreRelationships();

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.type === 'orphaned_product_supplier')).toBe(true);
    });

    it('should warn about missing supplier emails', () => {
      const supplierStore = useSupplierStore.getState();
      const supplier = supplierStore.addSupplier('Test Supplier'); // No email

      const sessionStore = useSessionStore.getState();
      const session = sessionStore.createSession();
      sessionStore.addItemToSession(session.id, {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierId: supplier.id
      });

      const result = validateCrossStoreRelationships();

      expect(result.warnings.some(w => w.type === 'missing_supplier_email')).toBe(true);
    });

    it('should warn about inconsistent supplier names', () => {
      const supplierStore = useSupplierStore.getState();
      const supplier = supplierStore.addSupplier('Correct Name', 'test@example.com');

      const sessionStore = useSessionStore.getState();
      const session = sessionStore.createSession();
      sessionStore.addItemToSession(session.id, {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierId: supplier.id,
        supplierName: 'Wrong Name'
      });

      const result = validateCrossStoreRelationships();

      expect(result.warnings.some(w => w.type === 'inconsistent_supplier_name')).toBe(true);
    });
  });

  describe('validateSessionItemSupplier', () => {
    it('should validate item with valid supplierId', () => {
      const supplierStore = useSupplierStore.getState();
      const supplier = supplierStore.addSupplier('Test Supplier', 'test@example.com');

      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierId: supplier.id
      };

      const result = validateSessionItemSupplier(item);

      expect(result.isValid).toBe(true);
      expect(result.supplier).toEqual(supplier);
      expect(result.error).toBeUndefined();
    });

    it('should detect invalid supplierId', () => {
      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierId: 'non-existent-id'
      };

      const result = validateSessionItemSupplier(item);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should find supplier by name when only supplierName provided', () => {
      const supplierStore = useSupplierStore.getState();
      const supplier = supplierStore.addSupplier('Test Supplier', 'test@example.com');

      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierName: 'Test Supplier'
      };

      const result = validateSessionItemSupplier(item);

      expect(result.isValid).toBe(true);
      expect(result.supplier).toEqual(supplier);
    });

    it('should allow creating new supplier when only name provided', () => {
      const item: SessionItem = {
        id: 'item-1',
        productName: 'Test Product',
        quantity: 1,
        supplierName: 'New Supplier'
      };

      const result = validateSessionItemSupplier(item);

      expect(result.isValid).toBe(true);
      expect(result.supplier).toBeNull(); // Will be created
    });
  });
});
