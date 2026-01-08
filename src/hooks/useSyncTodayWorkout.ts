import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { fetchCalendarToday, fetchActivities, syncActivitiesNow } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to automatically sync today's workout from Strava when opening a page
 * if it's not already saved.
 * 
 * This hook:
 * 1. Checks if today's workout is saved (either as a planned session or completed activity)
 * 2. If not saved and Strava is connected, triggers a sync from Strava
 * 3. Uses refs to prevent duplicate syncs
 */
export function useSyncTodayWorkout() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const hasSynced = useRef(false);
  const isSyncing = useRef(false);
  const lastSyncedDate = useRef<string | null>(null);

  // Fetch today's calendar data to check if workout is saved
  const { data: todayData, isLoading: todayLoading } = useAuthenticatedQuery({
    queryKey: ['calendarToday', today],
    queryFn: () => fetchCalendarToday(today),
    retry: 1,
    enabled: !loading && !!user && !!user.strava_connected,
  });

  // Fetch today's activities to check if workout is completed
  const { data: activities } = useAuthenticatedQuery({
    queryKey: ['activities', 'today'],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    enabled: !loading && !!user && !!user.strava_connected,
  });

  useEffect(() => {
    // Only run when auth is ready and user is authenticated with Strava connected
    if (loading || !user || !user.strava_connected) {
      return;
    }

    // Wait for today's data to load
    if (todayLoading) {
      return;
    }

    // Reset sync flag if date changed (new day)
    if (lastSyncedDate.current && lastSyncedDate.current !== today) {
      hasSynced.current = false;
      lastSyncedDate.current = null;
    }

    // Prevent duplicate syncs
    if (hasSynced.current || isSyncing.current) {
      return;
    }

    // Check if today's workout is already saved
    const todayWorkout = todayData?.sessions?.find(
      s => s.status === 'planned' || s.status === 'completed'
    ) || null;

    // Check if there's a completed activity for today
    const todayActivity = activities?.find(a => {
      if (!a.date) return false;
      const activityDate = a.date.split('T')[0];
      return activityDate === today;
    }) || null;

    // If today's workout is already saved (either planned session or completed activity), don't sync
    if (todayWorkout || todayActivity) {
      return;
    }

    // Today's workout is not saved - sync from Strava
    isSyncing.current = true;
    syncActivitiesNow()
      .then(() => {
        hasSynced.current = true;
        lastSyncedDate.current = today;
        // Invalidate queries to refresh data after sync
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        queryClient.invalidateQueries({ queryKey: ['calendarToday', today] });
        if (import.meta.env.DEV) {
          console.log('[SyncTodayWorkout] Synced today\'s workout from Strava');
        }
      })
      .catch((error) => {
        // Best-effort sync - don't block UI
        if (import.meta.env.DEV) {
          console.warn('[SyncTodayWorkout] Failed to sync today\'s workout:', error);
        }
      })
      .finally(() => {
        isSyncing.current = false;
      });
  }, [loading, user, todayLoading, todayData, activities, today, queryClient]);
}

