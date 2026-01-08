import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/auth';

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
  const { status, user, loading } = useAuth();
      const token = auth.getToken();
  
  // isLoaded = auth check is complete (not loading)
  // isAuthenticated = user exists and status is authenticated
  return {
    isLoaded: !loading && status !== "loading",
    isAuthenticated: status === "authenticated" && !!user,
    token: status === "authenticated" ? token : null,
  };
}

