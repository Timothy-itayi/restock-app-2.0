import Config from '../config';
import logger from '../helpers/logger';

/**
 * Parse Document API Client
 * Handles PDF/document parsing via backend worker
 */

export type ParsedItem = {
  id: string;
  product: string;
  supplier: string;
  quantity?: number;
};

export type ParseDocResponse = {
  items: ParsedItem[];
};

export type ParseDocError = {
  success: false;
  error: string;
  message?: string;
};

const PARSE_DOC_URL = Config.PARSE_DOC_API_URL;

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
  file: DocumentFile,
  onProgress?: (message: string, progress?: number) => void
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

    const isPdf = file.mimeType?.includes('pdf') || file.name?.endsWith('.pdf');
  
    // PDFs are not supported - only images
    if (isPdf) {
      return {
        success: false,
        error: 'PDF files are not supported. Please take a photo of your catalog instead.',
      };
    }

    // For images: Send directly
    onProgress?.('Uploading images...', 0);
  
    // Create FormData for React Native
    const formData = new FormData();
    formData.append('type', 'images');
    
    // React Native FormData format - append as 'images' field (can be multiple)
    formData.append('images', {
      uri: file.uri,
      name: file.name || 'image.jpg',
      type: file.mimeType || 'image/jpeg',
    } as any);

    logger.info('[parseDocument] Uploading image for parsing', { name: file.name });

    // Send to backend
    const response = await fetch(PARSE_DOC_URL, {
      method: 'POST',
      body: formData,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      let errorCode = '';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code || '';
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Use default error message
        }
      }

      // User-friendly messages for expected errors (400s)
      if (response.status === 400) {
        if (errorMessage.includes('Could not extract') || errorMessage.includes('No items found') || errorCode === 'NOT_PRODUCT_LIST') {
          errorMessage = 'This image doesn\'t appear to be a product list. Please upload an image of an inventory list, order form, or stock report.';
        }
        logger.userError('[parseDocument] Could not parse image', { status: response.status, errorMessage });
      } else {
        logger.error('[parseDocument] Server error during parsing', undefined, { status: response.status, errorMessage });
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
      logger.error('[parseDocument] Invalid JSON response', parseError);
      return {
        success: false,
        error: 'Invalid server response format',
      };
    }

    // Check if LLM returned an error (e.g., not a product list)
    if (data.error === 'not_product_list') {
      logger.userError('[parseDocument] Image is not a product list');
      return {
        success: false,
        error: 'This image doesn\'t appear to be a product list. Please upload an image of an inventory list, order form, or stock report.',
      };
    }

    // Validate response structure
    if (!data.items || !Array.isArray(data.items)) {
      logger.error('[parseDocument] Missing items array in response', data);
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
        const quantity = typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : undefined;

        // Skip items without product name
        if (!product) {
          return null;
        }

        return {
          id: raw.id || `parsed-${Date.now()}-${index}`,
          product,
          supplier,
          quantity,
        };
      })
      .filter((item: ParsedItem | null): item is ParsedItem => item !== null);

    // Check if we got any valid items
    if (items.length === 0) {
      logger.userError('[parseDocument] No valid items extracted from document');
      return {
        success: false,
        error: 'This image doesn\'t appear to be a product list. Please upload an image of an inventory list, order form, or stock report.',
      };
    }

    logger.info('[parseDocument] Successfully parsed document', { itemCount: items.length });

    return {
      success: true,
      items,
    };
  } catch (error: any) {
    logger.error('[parseDocument] Exception during parsing', error);

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
 * Parses multiple image files and returns structured items
 */
export async function parseImages(
  imageFiles: DocumentFile[],
  onProgress?: (message: string, progress?: number) => void
): Promise<{ success: true; items: ParsedItem[] } | { success: false; error: string }> {
  try {
    // Validate files
    if (!imageFiles || imageFiles.length === 0) {
      return {
        success: false,
        error: 'No images provided',
      };
    }

    // Check total size (10MB limit)
    const totalSize = imageFiles.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalSize > 10 * 1024 * 1024) {
      return {
        success: false,
        error: 'Total file size too large (limit 10 MB)',
      };
    }

    // Create FormData for React Native
    const formData = new FormData();
    formData.append('type', 'images');
    
    // Append all images
    for (const imageFile of imageFiles) {
      formData.append('images', {
        uri: imageFile.uri,
        name: imageFile.name || 'image.jpg',
        type: imageFile.mimeType || 'image/jpeg',
      } as any);
    }

    logger.info('[parseImages] Uploading batch images for parsing', { count: imageFiles.length });

    onProgress?.('Uploading images...', 50);

    // Send to backend
    const response = await fetch(PARSE_DOC_URL, {
      method: 'POST',
      body: formData,
    });

    // Handle non-OK responses
    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      let errorCode = '';
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorCode = errorData.code || '';
      } catch {
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        } catch {
          // Use default error message
        }
      }

      // User-friendly messages for expected errors (400s)
      if (response.status === 400) {
        // Make error messages more user-friendly
        if (errorMessage.includes('Could not extract') || errorCode === 'NOT_PRODUCT_LIST') {
          errorMessage = 'This image doesn\'t appear to be a product list. Please upload an image of an inventory list, order form, or stock report.';
        }
        logger.userError('[parseImages] Could not parse image', { status: response.status, errorMessage });
      } else {
        // Actual server errors (500s) - report to Sentry
        logger.error('[parseImages] Server error during batch parsing', undefined, { status: response.status, errorMessage });
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
      logger.error('[parseImages] Invalid JSON response', parseError);
      return {
        success: false,
        error: 'Invalid server response format',
      };
    }

    // Check if LLM returned an error (e.g., not a product list)
    if (data.error === 'not_product_list') {
      logger.userError('[parseImages] Image is not a product list');
      return {
        success: false,
        error: 'This image doesn\'t appear to be a product list. Please upload an image of an inventory list, order form, or stock report.',
      };
    }

    // Validate response structure
    if (!data.items || !Array.isArray(data.items)) {
      logger.error('[parseImages] Missing items array in batch response', data);
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
        const quantity = typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : undefined;

        // Skip items without product name
        if (!product) {
          return null;
        }

        return {
          id: raw.id || `parsed-${Date.now()}-${index}`,
          product,
          supplier,
          quantity,
        };
      })
      .filter((item: ParsedItem | null): item is ParsedItem => item !== null);

    // Check if we got any valid items
    if (items.length === 0) {
      logger.userError('[parseImages] No valid items extracted from batch images');
      return {
        success: false,
        error: 'This image doesn\'t appear to be a product list. Please upload an image of an inventory list, order form, or stock report.',
      };
    }

    logger.info('[parseImages] Successfully parsed batch images', { itemCount: items.length });

    return {
      success: true,
      items,
    };
  } catch (error: any) {
    logger.error('[parseImages] Exception during batch parsing', error);

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
      error: error.message || 'Failed to parse images',
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
