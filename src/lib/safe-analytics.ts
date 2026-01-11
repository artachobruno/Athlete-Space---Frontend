/**
 * Safe wrapper for third-party analytics and browser extension APIs.
 * 
 * This prevents crashes when:
 * - Browser extensions inject detectStore() that returns undefined
 * - Analytics libraries aren't loaded yet
 * - User is not authenticated
 */

/**
 * Safely calls a function that might return undefined or a Promise.
 * If the function returns undefined, returns a resolved Promise.
 * 
 * @param fn - Function to call (might return undefined or Promise)
 * @returns Promise that always resolves (never rejects)
 */
export function safeCall<T = unknown>(
  fn: (() => T | Promise<T>) | undefined | null
): Promise<T | undefined> {
  if (!fn || typeof fn !== 'function') {
    return Promise.resolve(undefined);
  }

  try {
    const result = fn();
    
    // If result is a Promise, return it (wrapped to never reject)
    if (result && typeof result === 'object' && 'then' in result) {
      return Promise.resolve(result).catch(() => undefined);
    }
    
    // If result is undefined or not a Promise, return it as resolved
    return Promise.resolve(result);
  } catch (error) {
    // If function throws, return undefined
    if (import.meta.env.DEV) {
      console.warn('[SafeAnalytics] Function call failed:', error);
    }
    return Promise.resolve(undefined);
  }
}

/**
 * Safely calls detectStore (from browser extensions or third-party libraries).
 * Returns a Promise that always resolves, even if detectStore is undefined.
 * 
 * @param detectStoreFn - The detectStore function (might be undefined)
 * @returns Promise that resolves when done (or immediately if detectStore is undefined)
 */
export function safeDetectStore(
  detectStoreFn?: (() => unknown) | (() => Promise<unknown>)
): Promise<void> {
  return safeCall(detectStoreFn).then(() => {
    // Always resolves, even if detectStore was undefined
  });
}

/**
 * Safely initializes analytics only when authenticated.
 * 
 * @param authStatus - Current auth status
 * @param initFn - Analytics initialization function
 */
export function safeInitAnalytics(
  authStatus: "loading" | "authenticated" | "unauthenticated",
  initFn?: () => void | Promise<void>
): void {
  // Only initialize when authenticated
  if (authStatus !== "authenticated") {
    return;
  }

  if (!initFn || typeof initFn !== 'function') {
    return;
  }

  // Wrap in safeCall to handle any errors
  safeCall(initFn).catch(() => {
    // Already handled by safeCall, but catch just in case
  });
}

/**
 * Safely tracks an analytics event.
 * No business logic attached - just emits the event.
 * 
 * @param eventName - Name of the event
 * @param properties - Optional event properties
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (import.meta.env.DEV) {
    console.log('[Analytics]', eventName, properties);
  }

  // Try to call window.analytics.track if available
  const analytics = (window as { analytics?: { track?: (name: string, props?: Record<string, unknown>) => void } }).analytics;
  if (analytics?.track && typeof analytics.track === 'function') {
    try {
      analytics.track(eventName, properties);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Analytics] Failed to track event:', error);
      }
    }
  }
}

