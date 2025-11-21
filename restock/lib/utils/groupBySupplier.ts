import type { SessionItem } from '../helpers/storage/sessions';
import type { Supplier } from '../../store/useSupplierStore';

/**
 * Grouped items for a single supplier.
 */
export type SupplierGroup = {
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  items: SessionItem[];
};

/**
 * Groups session items by supplier.
 * 
 * This is a pure function with stable output order:
 * - Suppliers are sorted alphabetically by name
 * - Items within each supplier group maintain their original order
 * - Handles both supplierId and supplierName matching
 * - Falls back to 'Unknown Supplier' for items without supplier info
 * 
 * @param items - Session items to group
 * @param suppliers - Available suppliers for lookup
 * @returns Array of supplier groups, sorted by supplier name
 */
export function groupBySupplier(
  items: SessionItem[],
  suppliers: Supplier[] = []
): SupplierGroup[] {
  if (!items || items.length === 0) {
    return [];
  }

  // Map to track supplier groups by key
  const groupsMap = new Map<string, SupplierGroup>();

  for (const item of items) {
    // Determine supplier key (prefer supplierId, fallback to supplierName)
    const supplierKey = item.supplierId || item.supplierName || 'unknown';
    const supplierId = item.supplierId || supplierKey;

    // Get or create supplier group
    let group = groupsMap.get(supplierKey);
    
    if (!group) {
      // Find supplier in store
      const supplier = item.supplierId
        ? suppliers.find((s) => s.id === item.supplierId)
        : suppliers.find(
            (s) =>
              s.name.toLowerCase().trim() ===
              (item.supplierName || '').toLowerCase().trim()
          );

      group = {
        supplierId: supplierId,
        supplierName: supplier?.name || item.supplierName || 'Unknown Supplier',
        supplierEmail: supplier?.email || '',
        items: []
      };

      groupsMap.set(supplierKey, group);
    }

    // Add item to appropriate group
    group.items.push(item);
  }

  // Convert map to array and sort by supplier name (stable order)
  const groups = Array.from(groupsMap.values());
  groups.sort((a, b) => {
    const nameA = a.supplierName.toLowerCase();
    const nameB = b.supplierName.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return groups;
}
