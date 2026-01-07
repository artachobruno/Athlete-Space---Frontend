import { useState, useEffect } from 'react';
import { auth } from '@/lib/auth';

/**
 * Auth state that tracks if authentication is ready.
 * This prevents race conditions where API calls are made before auth is initialized.
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
  const [state, setState] = useState<AuthState>({
    isLoaded: false,
    isAuthenticated: false,
    token: null,
  });

  useEffect(() => {
    // Check auth state on mount and when storage changes
    const checkAuth = () => {
      const token = auth.getToken();
      const isAuthenticated = auth.isLoggedIn(); // This checks token exists and is not expired
      
      setState({
        isLoaded: true,
        isAuthenticated,
        token: isAuthenticated ? token : null,
      });
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (token might be set in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also check periodically in case token is set in same window
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return state;
}

