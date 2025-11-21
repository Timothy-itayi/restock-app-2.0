/**
 * Standard error formatting for API responses
 * Ensures errors never leak raw stack traces to clients
 */

export interface ApiError {
  success: false;
  error: string;
  message?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data?: T;
  [key: string]: any;
}

export type ApiResponse<T = any> = ApiError | ApiSuccess<T>;

/**
 * Creates a standardized error response
 * Never includes stack traces or internal details
 */
export function createError(
  message: string,
  status: number = 400,
  code?: string
): { response: Response; status: number } {
  const error: ApiError = {
    success: false,
    error: code || getErrorCode(status),
    message,
  };

  return {
    response: new Response(JSON.stringify(error), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
    status,
  };
}

/**
 * Maps HTTP status codes to error codes
 */
function getErrorCode(status: number): string {
  if (status >= 400 && status < 500) {
    return "CLIENT_ERROR";
  }
  if (status >= 500) {
    return "SERVER_ERROR";
  }
  return "UNKNOWN_ERROR";
}

/**
 * Wraps an error to prevent stack trace leakage
 */
export function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // In production, only return the message
    // In development, you might want to log the full error
    return err.message || "An unexpected error occurred";
  }
  if (typeof err === "string") {
    return err;
  }
  return "An unexpected error occurred";
}

/**
 * Creates a success response
 */
export function createSuccess<T>(
  data?: T,
  status: number = 200,
  extra?: Record<string, any>
): Response {
  const response: ApiSuccess<T> = {
    success: true,
    ...(data !== undefined && { data }),
    ...extra,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

