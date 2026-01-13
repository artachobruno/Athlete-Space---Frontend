import { useAuth } from '@/context/AuthContext';

/**
 * Auth state that tracks if authentication is ready.
 * This prevents race conditions where API calls are made before auth is initialized.
 * 
 * Uses AuthContext - authentication is handled by HTTP-only cookies.
 */
export interface AuthState {
  isLoaded: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook to get authentication state.
 * Returns auth readiness status to gate API calls.
 * 
 * Usage:
 * ```ts
 * const { isLoaded, isAuthenticated } = useAuthState();
 * 
 * useEffect(() => {
 *   if (!isLoaded) return; // Wait for auth to load
 *   if (!isAuthenticated) return; // Don't make authenticated calls
 *   
 *   // Now safe to make API calls (cookies are sent automatically)
 *   fetchData();
 * }, [isLoaded, isAuthenticated]);
 * ```
 */
export function useAuthState(): AuthState {
  const { status, user, authReady } = useAuth();
  
  // isLoaded = auth check is complete (authReady from context)
  // isAuthenticated = user exists and status is authenticated
  // Cookies handle authentication automatically - no token needed
  const isAuthenticated = authReady && status === "authenticated" && !!user;
  
  return {
    isLoaded: authReady,
    isAuthenticated,
  };
}

