/**
 * Global Error Handling Utilities
 * 
 * Provides consistent error handling patterns across the app.
 * All errors should be handled gracefully with user-friendly messages.
 */

import logger from './logger';

export type ErrorState = {
  hasError: boolean;
  message: string;
  canRetry?: boolean;
};

/**
 * Creates a user-friendly error message from an error object.
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Storage errors
    if (error.message.includes('storage') || error.message.includes('AsyncStorage')) {
      return 'Storage error. Please try again or restart the app.';
    }
    
    // Generic error
    return error.message || 'An unexpected error occurred. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Checks if an error is retryable (typically network errors).
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('connection')
    );
  }
  return false;
}

/**
 * Creates an error state object for UI display.
 */
export function createErrorState(error: unknown): ErrorState {
  return {
    hasError: true,
    message: getUserFriendlyError(error),
    canRetry: isRetryableError(error),
  };
}

/**
 * Safe wrapper for async operations that handles errors gracefully.
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  fallback: T,
  onError?: (error: unknown) => void
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error('Operation failed', error);
    if (onError) {
      onError(error);
    }
    return fallback;
  }
}

/**
 * Safe wrapper for synchronous operations that handles errors gracefully.
 */
export function safeSync<T>(
  operation: () => T,
  fallback: T,
  onError?: (error: unknown) => void
): T {
  try {
    return operation();
  } catch (error) {
    logger.error('Operation failed', error);
    if (onError) {
      onError(error);
    }
    return fallback;
  }
}

/**
 * Captures an error and sends it to the logging service.
 */
export function captureError(error: unknown, context?: string): void {
  const message = context ? `[${context}] ${getUserFriendlyError(error)}` : getUserFriendlyError(error);
  logger.error(message, error);
}

/**
 * Validates that a value is not null or undefined.
 * Returns a fallback if the value is invalid.
 */
export function safeRead<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback;
}

