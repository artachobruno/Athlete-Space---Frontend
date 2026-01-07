import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useAuthState } from './useAuthState';

/**
 * Wrapper around useQuery that automatically gates queries behind authentication.
 * 
 * This prevents race conditions where queries fire before auth is ready.
 * 
 * Usage:
 * ```ts
 * const { data, isLoading } = useAuthenticatedQuery({
 *   queryKey: ['activities'],
 *   queryFn: () => fetchActivities(),
 * });
 * ```
 * 
 * The query will only execute when:
 * 1. Auth is loaded (isLoaded === true)
 * 2. User is authenticated (isAuthenticated === true)
 * 
 * If auth is not ready or user is not authenticated, the query will be disabled.
 */
export function useAuthenticatedQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError> & {
    queryKey: unknown[];
    queryFn: () => Promise<TData>;
  }
): UseQueryResult<TData, TError> {
  const { isLoaded, isAuthenticated } = useAuthState();
  
  // Gate query behind auth readiness
  const enabled = isLoaded && isAuthenticated && (options.enabled !== false);
  
  return useQuery<TData, TError>({
    ...options,
    enabled,
    // Override retry to never retry on 401
    retry: (failureCount, error) => {
      // Never retry on 401 - auth is not ready or token is invalid
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number };
        if (apiError.status === 401) {
          return false;
        }
      }
      // Use custom retry logic if provided, otherwise use default
      if (options.retry !== undefined) {
        if (typeof options.retry === 'function') {
          return options.retry(failureCount, error);
        }
        if (typeof options.retry === 'number') {
          return failureCount < options.retry;
        }
        return false;
      }
      return failureCount < 1;
    },
  });
}

