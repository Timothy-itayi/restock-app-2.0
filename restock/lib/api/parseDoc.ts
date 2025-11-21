/**
 * Parse Document API Client
 * Handles PDF/document parsing via backend worker
 */

export type ParsedItem = {
  id: string;
  product: string;
  supplier: string;
};

export type ParseDocResponse = {
  items: ParsedItem[];
};

export type ParseDocError = {
  success: false;
  error: string;
  message?: string;
};

const PARSE_DOC_URL = 'https://restock-parse-doc.parse-doc.workers.dev';

/**
 * File object from expo-document-picker
 */
export type DocumentFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
};

/**
 * Parses a document file and returns structured items
 */
export async function parseDocument(
  file: DocumentFile
): Promise<{ success: true; items: ParsedItem[] } | { success: false; error: string }> {
  try {
    // Validate file
    if (!file || !file.uri) {
      return {
        success: false,
        error: 'Invalid file',
      };
    }

    // Check file size (10MB limit)
    if (file.size && file.size > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'File too large (limit 10 MB)',
      };
    }

    // Create FormData for React Native
    const formData = new FormData();
    
    // React Native FormData format
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'document.pdf',
      type: file.mimeType || 'application/pdf',
    } as any);

    // Send to backend
    const response = await fetch(PARSE_DOC_URL, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type - let React Native set it with boundary
      },
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      
      try {
        const errorData = await response.json();
        // Prefer message over error code for user-facing messages
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // If JSON parsing fails, try text
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Use default error message
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    // Parse response
    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      return {
        success: false,
        error: 'Invalid server response format',
      };
    }

    // Validate response structure
    if (!data.items || !Array.isArray(data.items)) {
      return {
        success: false,
        error: 'Invalid response format: missing items array',
      };
    }

    // Transform and validate items
    const items: ParsedItem[] = data.items
      .map((raw: any, index: number) => {
        const product = typeof raw.product === 'string' ? raw.product.trim() : '';
        const supplier = typeof raw.supplier === 'string' ? raw.supplier.trim() : '';

        // Skip items without product name
        if (!product) {
          return null;
        }

        return {
          id: raw.id || `parsed-${Date.now()}-${index}`,
          product,
          supplier,
        };
      })
      .filter((item: ParsedItem | null): item is ParsedItem => item !== null);

    // Check if we got any valid items
    if (items.length === 0) {
      return {
        success: false,
        error: 'No items found in document',
      };
    }

    return {
      success: true,
      items,
    };
  } catch (error: any) {
    console.error('parseDocument error:', error);

    // Handle network errors
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }

    // Handle other errors
    return {
      success: false,
      error: error.message || 'Failed to parse document',
    };
  }
}

/**
 * Validates a parsed item structure
 */
export function validateParsedItem(item: any): item is ParsedItem {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.product === 'string' &&
    item.product.trim().length > 0 &&
    typeof item.supplier === 'string'
  );
}

/**
 * Validates parsed items array
 */
export function validateParsedItems(items: any[]): items is ParsedItem[] {
  return Array.isArray(items) && items.every(validateParsedItem);
}

