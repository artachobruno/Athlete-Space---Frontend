/**
 * API Error Classification
 * 
 * Classifies API errors to determine appropriate handling:
 * - TERMINAL: Stop immediately (404, 403, 401)
 * - RETRYABLE: Exponential backoff (5xx, 429, network)
 * - USER_ACTION: Surface to UI, no retry (400 validation)
 */

export type ApiErrorClass = "RETRYABLE" | "TERMINAL" | "USER_ACTION";

export interface ClassifiedError {
  class: ApiErrorClass;
  status?: number;
  message: string;
  originalError: unknown;
}

/**
 * Classify an API error based on HTTP status code and error type.
 * 
 * Rules:
 * - TERMINAL (404, 403, 401): Resource doesn't exist, access denied, or auth required
 *   → Stop polling/retrying immediately
 * - RETRYABLE (5xx, 429, network): Server error, rate limit, or network issue
 *   → Exponential backoff, retry with limits
 * - USER_ACTION (400): Validation error or bad request
 *   → Surface to UI, no retry
 * 
 * @param error - Error object (AxiosError, ApiError, or unknown)
 * @returns Classified error with class and metadata
 */
export function classifyApiError(error: unknown): ClassifiedError {
  // Extract status code
  let status: number | undefined;
  let message = "Unknown error";
  
  if (error && typeof error === "object") {
    // AxiosError structure
    if ("response" in error && error.response) {
      const axiosResponse = error.response as { status?: number; data?: { message?: string; detail?: string } };
      status = axiosResponse.status;
      message = axiosResponse.data?.message || axiosResponse.data?.detail || `HTTP ${status}`;
    }
    // ApiError structure (from our API client)
    else if ("status" in error) {
      status = error.status as number;
      message = ("message" in error ? error.message : `HTTP ${status}`) as string;
    }
    // Generic Error
    else if (error instanceof Error) {
      message = error.message;
    }
  }

  // Classify based on status code
  if (status !== undefined) {
    // TERMINAL: Resource doesn't exist, access denied, or auth required
    if (status === 404 || status === 403 || status === 401) {
      return {
        class: "TERMINAL",
        status,
        message,
        originalError: error,
      };
    }

    // USER_ACTION: Validation errors or bad requests
    if (status === 400 || status === 422) {
      return {
        class: "USER_ACTION",
        status,
        message,
        originalError: error,
      };
    }

    // RETRYABLE: Server errors, rate limiting
    if (status >= 500 || status === 429 || status === 408) {
      return {
        class: "RETRYABLE",
        status,
        message,
        originalError: error,
      };
    }
  }

  // Network errors (no status) are RETRYABLE
  if (!status) {
    return {
      class: "RETRYABLE",
      message: message || "Network error",
      originalError: error,
    };
  }

  // Default: treat unknown status codes as RETRYABLE (conservative)
  return {
    class: "RETRYABLE",
    status,
    message,
    originalError: error,
  };
}

/**
 * Check if an error is terminal (should stop polling/retrying).
 */
export function isTerminalError(error: unknown): boolean {
  return classifyApiError(error).class === "TERMINAL";
}

/**
 * Check if an error is retryable (can retry with backoff).
 */
export function isRetryableError(error: unknown): boolean {
  return classifyApiError(error).class === "RETRYABLE";
}

/**
 * Check if an error requires user action (surface to UI).
 */
export function isUserActionError(error: unknown): boolean {
  return classifyApiError(error).class === "USER_ACTION";
}
