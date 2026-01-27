import { useMutation, useQueryClient } from '@tanstack/react-query';
import { activitiesApi, calendarApi } from '@/lib/api/typedClient';

/**
 * Invalidates calendar queries for the active view only (not season).
 * 
 * **CRITICAL**: Does NOT invalidate calendarSeason to prevent refetch storms.
 * Only invalidates the active view's queries (week, month, today, range).
 * 
 * For delete operations, the UI should remove the item from local cache
 * or refetch only the active range, not the entire season.
 */
function invalidateActiveView(queryClient: ReturnType<typeof useQueryClient>) {
  // Invalidate week, month, today, and range queries (bounded fetches)
  queryClient.invalidateQueries({
    queryKey: ['calendarWeek'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendar', 'month'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendarToday'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendarRange'],
    exact: false,
  });
  // Also invalidate activities (needed for activity deletion)
  queryClient.invalidateQueries({
    queryKey: ['activities'],
    exact: false,
  });
  
  // DO NOT invalidate calendarSeason - it causes OOM refetch storms
  // Season endpoint should only be used for analytics, not UI rendering
}

/**
 * Hook for deleting an executed activity.
 * Calls DELETE /activities/{activityId} and invalidates calendar queries.
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      activitiesApi.delete(activityId),
    onSuccess: () => {
      invalidateActiveView(queryClient);
    },
  });
}

/**
 * Hook for deleting a planned session.
 * Calls DELETE /planned-sessions/{plannedSessionId} and invalidates calendar queries.
 */
export function useDeletePlannedSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (plannedSessionId: string) =>
      calendarApi.deletePlannedSession(plannedSessionId),
    onSuccess: () => {
      invalidateActiveView(queryClient);
    },
  });
}
