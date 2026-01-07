import { useEffect } from 'react';
import { checkRecentActivities } from '@/lib/api';
import { auth } from '@/lib/auth';

/**
 * Hook to automatically check for recent activities on app mount/page refresh
 * Calls /me/sync/check which runs in background to ensure today's activities are synced
 */
export function useSyncActivities() {
  useEffect(() => {
    // Only check if user is authenticated
    if (!auth.getToken()) {
      return;
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
  }, []); // Only run once on mount
}

