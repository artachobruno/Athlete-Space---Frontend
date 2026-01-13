import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

/**
 * Invalidates all calendar-related queries after delete mutations.
 * Ensures UI updates immediately after delete operations.
 */
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['calendar'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendarWeek'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendarSeason'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendar-week'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendar-season'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendarToday'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['activities'],
    exact: false,
  });
}

/**
 * Hook for deleting an executed activity.
 * Calls DELETE /activities/{activityId} and invalidates calendar queries.
 */
export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) =>
      api.delete(`/activities/${activityId}`),
    onSuccess: () => {
      invalidateAll(queryClient);
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
      api.delete(`/planned-sessions/${plannedSessionId}`),
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });
}
