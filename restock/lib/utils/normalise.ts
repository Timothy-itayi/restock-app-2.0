export function normalizeSupplierName(name: string): string {
    return name?.trim().toLowerCase() || '';
  }
  
  export function normalizeProductName(name: string): string {
    return name?.trim().toLowerCase() || '';
  }
  
  export function safeString(val: any): string {
    return typeof val === 'string' ? val.trim() : '';
  }
  
  export function ensureId(prefix = 'id') {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }
  