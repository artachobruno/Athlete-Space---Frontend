import { useMutation, useQueryClient } from '@tanstack/react-query';
import { manualPair, manualUnpair } from '@/lib/api';

/**
 * Invalidates all calendar-related queries after pairing mutations.
 * Ensures UI updates immediately after unpair/merge operations.
 */
function invalidateCalendar(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({
    queryKey: ['calendar'],
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
    queryKey: ['calendarWeek'],
    exact: false,
  });
  queryClient.invalidateQueries({
    queryKey: ['calendarSeason'],
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
 * Hook for manually pairing an activity with a planned session.
 * Calls POST /admin/pairing/merge and invalidates calendar queries.
 */
export function useManualPair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ activityId, plannedSessionId }: { activityId: string; plannedSessionId: string }) =>
      manualPair(activityId, plannedSessionId),
    onSuccess: () => {
      invalidateCalendar(queryClient);
    },
  });
}

/**
 * Hook for manually unpairing an activity from its planned session.
 * Calls POST /admin/pairing/unmerge and invalidates calendar queries.
 */
export function useManualUnpair() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) => manualUnpair(activityId),
    onSuccess: () => {
      invalidateCalendar(queryClient);
    },
  });
}
