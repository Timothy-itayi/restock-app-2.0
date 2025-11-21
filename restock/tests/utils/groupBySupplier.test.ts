import { groupBySupplier } from '../../lib/utils/groupBySupplier';
import type { SessionItem } from '../../lib/helpers/storage/sessions';
import type { Supplier } from '../../store/useSupplierStore';

describe('groupBySupplier', () => {
  const mockSuppliers: Supplier[] = [
    { id: 'supplier-1', name: 'Acme Foods', email: 'orders@acme.com' },
    { id: 'supplier-2', name: 'Best Supplies', email: 'contact@best.com' },
    { id: 'supplier-3', name: 'Charlie\'s Market', email: 'hello@charlie.com' }
  ];

  describe('Pure function behavior', () => {
    it('should return the same result for the same input', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' },
        { id: '2', productName: 'Product B', quantity: 2, supplierId: 'supplier-2' }
      ];

      const result1 = groupBySupplier(items, mockSuppliers);
      const result2 = groupBySupplier(items, mockSuppliers);

      expect(result1).toEqual(result2);
    });

    it('should not mutate input arrays', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' }
      ];
      const suppliers = [...mockSuppliers];
      const originalItems = JSON.parse(JSON.stringify(items));
      const originalSuppliers = JSON.parse(JSON.stringify(suppliers));

      groupBySupplier(items, suppliers);

      expect(items).toEqual(originalItems);
      expect(suppliers).toEqual(originalSuppliers);
    });
  });

  describe('Stable output order', () => {
    it('should sort suppliers alphabetically by name', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-3' }, // Charlie's Market
        { id: '2', productName: 'Product B', quantity: 2, supplierId: 'supplier-1' }, // Acme Foods
        { id: '3', productName: 'Product C', quantity: 3, supplierId: 'supplier-2' }  // Best Supplies
      ];

      const result = groupBySupplier(items, mockSuppliers);

      expect(result[0].supplierName).toBe('Acme Foods');
      expect(result[1].supplierName).toBe('Best Supplies');
      expect(result[2].supplierName).toBe('Charlie\'s Market');
    });

    it('should maintain stable order across multiple calls', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-3' },
        { id: '2', productName: 'Product B', quantity: 2, supplierId: 'supplier-1' },
        { id: '3', productName: 'Product C', quantity: 3, supplierId: 'supplier-2' }
      ];

      const result1 = groupBySupplier(items, mockSuppliers);
      const result2 = groupBySupplier(items, mockSuppliers);

      expect(result1.map(g => g.supplierName)).toEqual(result2.map(g => g.supplierName));
    });

    it('should maintain item order within each supplier group', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' },
        { id: '2', productName: 'Product B', quantity: 2, supplierId: 'supplier-1' },
        { id: '3', productName: 'Product C', quantity: 3, supplierId: 'supplier-1' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      const group = result.find(g => g.supplierId === 'supplier-1')!;

      expect(group.items[0].id).toBe('1');
      expect(group.items[1].id).toBe('2');
      expect(group.items[2].id).toBe('3');
    });
  });

  describe('Edge cases', () => {
    it('should return empty array for empty items', () => {
      const result = groupBySupplier([], mockSuppliers);
      expect(result).toEqual([]);
    });

    it('should return empty array for null items', () => {
      const result = groupBySupplier(null as any, mockSuppliers);
      expect(result).toEqual([]);
    });

    it('should handle items without supplier information', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1 }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].supplierName).toBe('Unknown Supplier');
      expect(result[0].supplierId).toBe('unknown');
      expect(result[0].supplierEmail).toBe('');
      expect(result[0].items).toEqual(items);
    });

    it('should handle items with only supplierName (no supplierId)', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierName: 'Acme Foods' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].supplierName).toBe('Acme Foods');
      expect(result[0].supplierId).toBe('Acme Foods');
      expect(result[0].supplierEmail).toBe('orders@acme.com');
    });

    it('should handle items with supplierName that does not match any supplier', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierName: 'Non-existent Supplier' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].supplierName).toBe('Non-existent Supplier');
      expect(result[0].supplierId).toBe('Non-existent Supplier');
      expect(result[0].supplierEmail).toBe('');
    });

    it('should handle items with supplierId that does not exist in suppliers array', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'non-existent-id' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].supplierId).toBe('non-existent-id');
      expect(result[0].supplierName).toBe('Unknown Supplier');
      expect(result[0].supplierEmail).toBe('');
    });

    it('should group items by supplierId when both supplierId and supplierName are present', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1', supplierName: 'Wrong Name' },
        { id: '2', productName: 'Product B', quantity: 2, supplierId: 'supplier-1', supplierName: 'Also Wrong' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].supplierName).toBe('Acme Foods'); // Uses supplier from store, not supplierName
      expect(result[0].supplierEmail).toBe('orders@acme.com');
      expect(result[0].items.length).toBe(2);
    });

    it('should handle case-insensitive supplier name matching when suppliers array provided', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierName: 'acme foods' },
        { id: '2', productName: 'Product B', quantity: 2, supplierName: 'ACME FOODS' },
        { id: '3', productName: 'Product C', quantity: 3, supplierName: 'Acme Foods' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      // Note: groupBySupplier uses raw supplierName as key, so different cases create separate groups
      // But when suppliers array is provided, it normalizes the name for display
      expect(result.length).toBe(3); // Three different keys
      // All should normalize to 'Acme Foods' from suppliers array
      expect(result.every(g => g.supplierName === 'Acme Foods')).toBe(true);
    });

    it('should handle whitespace in supplier names when suppliers array provided', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierName: '  Acme Foods  ' },
        { id: '2', productName: 'Product B', quantity: 2, supplierName: 'Acme Foods' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      // Note: groupBySupplier uses raw supplierName as key, so whitespace creates separate groups
      // But when suppliers array is provided, it normalizes the name for display
      expect(result.length).toBe(2); // Two different keys due to whitespace
      // Both should normalize to 'Acme Foods' from suppliers array
      expect(result.every(g => g.supplierName === 'Acme Foods')).toBe(true);
    });

    it('should handle empty suppliers array', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' },
        { id: '2', productName: 'Product B', quantity: 2, supplierName: 'Acme Foods' }
      ];

      const result = groupBySupplier(items, []);
      
      expect(result.length).toBe(2);
      // Items are sorted alphabetically, so 'Acme Foods' comes before 'Unknown Supplier'
      expect(result[0].supplierName).toBe('Acme Foods');
      expect(result[1].supplierName).toBe('Unknown Supplier');
    });

    it('should handle multiple items with the same supplier', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' },
        { id: '2', productName: 'Product B', quantity: 2, supplierId: 'supplier-1' },
        { id: '3', productName: 'Product C', quantity: 3, supplierId: 'supplier-1' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].items.length).toBe(3);
      expect(result[0].supplierId).toBe('supplier-1');
    });

    it('should handle items with empty string supplierName', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierName: '' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(1);
      expect(result[0].supplierName).toBe('Unknown Supplier');
      expect(result[0].supplierId).toBe('unknown');
    });

    it('should handle mixed supplier identification (some with ID, some with name)', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' },
        { id: '2', productName: 'Product B', quantity: 2, supplierName: 'Best Supplies' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result.length).toBe(2);
      expect(result[0].supplierName).toBe('Acme Foods');
      expect(result[1].supplierName).toBe('Best Supplies');
    });
  });

  describe('Supplier email handling', () => {
    it('should include supplier email when supplier is found', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result[0].supplierEmail).toBe('orders@acme.com');
    });

    it('should return empty email when supplier is not found', () => {
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'non-existent' }
      ];

      const result = groupBySupplier(items, mockSuppliers);
      
      expect(result[0].supplierEmail).toBe('');
    });

    it('should handle suppliers without email', () => {
      const suppliersWithoutEmail: Supplier[] = [
        { id: 'supplier-1', name: 'Acme Foods' }
      ];
      const items: SessionItem[] = [
        { id: '1', productName: 'Product A', quantity: 1, supplierId: 'supplier-1' }
      ];

      const result = groupBySupplier(items, suppliersWithoutEmail);
      
      expect(result[0].supplierEmail).toBe('');
    });
  });
});
