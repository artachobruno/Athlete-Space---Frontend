import { useAuth } from '@/context/AuthContext';
import { getToken } from '@/auth/token';

/**
 * Auth state that tracks if authentication is ready.
 * This prevents race conditions where API calls are made before auth is initialized.
 * 
 * Now uses AuthContext for consistency instead of checking localStorage directly.
 */
export interface AuthState {
  isLoaded: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

/**
 * Hook to get authentication state.
 * Returns auth readiness status to gate API calls.
 * 
 * Usage:
 * ```ts
 * const { isLoaded, isAuthenticated, token } = useAuthState();
 * 
 * useEffect(() => {
 *   if (!isLoaded) return; // Wait for auth to load
 *   if (!isAuthenticated) return; // Don't make authenticated calls
 *   
 *   // Now safe to make API calls
 *   fetchData();
 * }, [isLoaded, isAuthenticated]);
 * ```
 */
export function useAuthState(): AuthState {
  const { status, user, authReady } = useAuth();
  
  // SINGLE SOURCE OF TRUTH: Read token using centralized utility
  // This ensures consistency with interceptor
  const token = getToken();
  
  // isLoaded = auth check is complete (authReady from context)
  // isAuthenticated = user exists, status is authenticated, AND token exists
  // CRITICAL: All three must be true - prevents divergence
  const isAuthenticated = authReady && status === "authenticated" && !!user && !!token;
  
  return {
    isLoaded: authReady,
    isAuthenticated,
    token: isAuthenticated ? token : null,
  };
}

