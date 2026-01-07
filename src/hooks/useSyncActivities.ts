import { useEffect } from 'react';
import { checkRecentActivities } from '@/lib/api';
import { useAuthState } from './useAuthState';

/**
 * Hook to automatically check for recent activities on app mount/page refresh
 * Calls /me/sync/check which runs in background to ensure today's activities are synced
 * 
 * CRITICAL: Only runs when auth is ready and user is authenticated.
 * This prevents race conditions where sync is called before token is available.
 */
export function useSyncActivities() {
  const { isLoaded, isAuthenticated } = useAuthState();
  
  useEffect(() => {
    // CRITICAL: Wait for auth to be ready before making API calls
    if (!isLoaded) {
      return; // Auth not ready yet - wait
    }
    
    // Only check if user is authenticated
    if (!isAuthenticated) {
      return; // User not authenticated - don't make authenticated API calls
    }

    // Call sync check on mount (page refresh or new session)
    // Runs in background, non-blocking
    checkRecentActivities().catch((error) => {
      // Silently fail - sync check is best effort
      // Errors are expected if user doesn't have Strava connected or backend is down
      if (process.env.NODE_ENV === 'development') {
        console.log('[Sync] Activity check failed (expected if no Strava connection):', error);
      }
    });
  }, [isLoaded, isAuthenticated]); // Re-run when auth state changes
}

