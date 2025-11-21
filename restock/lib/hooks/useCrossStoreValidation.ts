import { useEffect, useCallback } from 'react';
import { useSessionStore } from '../../store/useSessionStore';
import { useSupplierStore } from '../../store/useSupplierStore';
import { useProductsStore } from '../../store/useProductsStore';
import type { SessionItem } from '../helpers/storage/sessions';

/**
 * Cross-store validation results
 */
export type ValidationResult = {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export type ValidationError = {
  type: 'orphaned_supplier_id' | 'orphaned_product_supplier' | 'invalid_supplier_reference';
  message: string;
  entityId?: string;
  entityType?: 'session' | 'session_item' | 'product';
};

export type ValidationWarning = {
  type: 'missing_supplier_email' | 'inconsistent_supplier_name';
  message: string;
  entityId?: string;
  entityType?: 'session_item' | 'supplier';
};

/**
 * Validates cross-store relationships:
 * - Session items with supplierId reference existing suppliers
 * - Session items with supplierName can be matched to suppliers
 * - Product history references valid suppliers
 * 
 * @returns Validation result with errors and warnings
 */
export function validateCrossStoreRelationships(): ValidationResult {
  const sessions = useSessionStore.getState().sessions;
  const suppliers = useSupplierStore.getState().suppliers;
  const products = useProductsStore.getState().products;

  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Create supplier lookup maps
  const suppliersById = new Map(suppliers.map(s => [s.id, s]));
  const suppliersByName = new Map(
    suppliers.map(s => [s.name.toLowerCase().trim(), s])
  );

  // Validate session items
  sessions.forEach(session => {
    session.items.forEach(item => {
      // Check supplierId references
      if (item.supplierId) {
        const supplier = suppliersById.get(item.supplierId);
        if (!supplier) {
          errors.push({
            type: 'orphaned_supplier_id',
            message: `Session item "${item.productName}" references non-existent supplier ID "${item.supplierId}"`,
            entityId: item.id,
            entityType: 'session_item'
          });
        } else {
          // Check if supplierName is inconsistent with supplier from store
          if (item.supplierName && item.supplierName !== supplier.name) {
            warnings.push({
              type: 'inconsistent_supplier_name',
              message: `Session item "${item.productName}" has supplierName "${item.supplierName}" but supplierId points to "${supplier.name}"`,
              entityId: item.id,
              entityType: 'session_item'
            });
          }

          // Warn if supplier exists but has no email
          if (!supplier.email) {
            warnings.push({
              type: 'missing_supplier_email',
              message: `Supplier "${supplier.name}" is referenced but has no email address`,
              entityId: supplier.id,
              entityType: 'supplier'
            });
          }
        }
      }

      // Check supplierName references (if no supplierId)
      if (!item.supplierId && item.supplierName) {
        const normalizedName = item.supplierName.toLowerCase().trim();
        const matchingSupplier = suppliersByName.get(normalizedName);
        
        if (matchingSupplier && !matchingSupplier.email) {
          warnings.push({
            type: 'missing_supplier_email',
            message: `Supplier "${matchingSupplier.name}" is referenced by name but has no email address`,
            entityId: matchingSupplier.id,
            entityType: 'supplier'
          });
        }
      }
    });
  });

  // Validate product history references
  products.forEach(product => {
    if (product.lastSupplierId) {
      const supplier = suppliersById.get(product.lastSupplierId);
      if (!supplier) {
        errors.push({
          type: 'orphaned_product_supplier',
          message: `Product "${product.name}" references non-existent supplier ID "${product.lastSupplierId}"`,
          entityId: product.id,
          entityType: 'product'
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * React hook for cross-store validation
 * Validates relationships between sessions, suppliers, and products
 * 
 * @param onValidationChange - Optional callback when validation state changes
 * @returns Validation result and refresh function
 */
export function useCrossStoreValidation(
  onValidationChange?: (result: ValidationResult) => void
) {
  const sessions = useSessionStore(state => state.sessions);
  const suppliers = useSupplierStore(state => state.suppliers);
  const products = useProductsStore(state => state.products);

  const validate = useCallback(() => {
    return validateCrossStoreRelationships();
  }, []);

  // Re-validate when stores change
  useEffect(() => {
    const result = validateCrossStoreRelationships();
    onValidationChange?.(result);
  }, [sessions, suppliers, products, onValidationChange]);

  return {
    validate,
    result: validateCrossStoreRelationships()
  };
}

/**
 * Validates a single session item's supplier reference
 * Useful for validating items before adding to sessions
 * 
 * @param item - Session item to validate
 * @returns Validation result for this item
 */
export function validateSessionItemSupplier(item: SessionItem): {
  isValid: boolean;
  supplier?: { id: string; name: string; email?: string } | null;
  error?: string;
  warning?: string;
} {
  const suppliers = useSupplierStore.getState().suppliers;
  const suppliersById = new Map(suppliers.map(s => [s.id, s]));
  const suppliersByName = new Map(
    suppliers.map(s => [s.name.toLowerCase().trim(), s])
  );

  // If supplierId is provided, validate it exists
  if (item.supplierId) {
    const supplier = suppliersById.get(item.supplierId);
    if (!supplier) {
      return {
        isValid: false,
        supplier: null,
        error: `Supplier with ID "${item.supplierId}" not found`
      };
    }

    // Check for name inconsistency
    if (item.supplierName && item.supplierName !== supplier.name) {
      return {
        isValid: true,
        supplier,
        warning: `supplierName "${item.supplierName}" doesn't match supplier "${supplier.name}"`
      };
    }

    return {
      isValid: true,
      supplier,
      warning: supplier.email ? undefined : 'Supplier has no email address'
    };
  }

  // If only supplierName is provided, try to find matching supplier
  if (item.supplierName) {
    const normalizedName = item.supplierName.toLowerCase().trim();
    const supplier = suppliersByName.get(normalizedName);
    
    if (supplier) {
      return {
        isValid: true,
        supplier,
        warning: supplier.email ? undefined : 'Supplier has no email address'
      };
    }

    // Name provided but supplier doesn't exist - this is valid, will create new supplier
    return {
      isValid: true,
      supplier: null
    };
  }

  // No supplier information - valid but no supplier
  return {
    isValid: true,
    supplier: null
  };
}
