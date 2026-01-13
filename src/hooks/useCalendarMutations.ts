import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createManualSession,
  createManualWeek,
  updatePlannedSessionDate,
  updateSessionStatus,
  updateWorkoutDate,
  type CalendarSession,
  type WriteResponse,
} from '@/lib/api';

/**
 * PHASE F4: Invalidates all calendar-related queries aggressively.
 * This ensures the calendar UI updates immediately after any mutation.
 * 
 * CRITICAL: Must invalidate all calendar query keys to ensure UI updates:
 * - ['calendar'] - base calendar queries (including month views)
 * - ['calendarWeek'] - week queries
 * - ['calendarSeason'] - season queries
 * - ['calendarToday'] - today queries
 * 
 * No local state mutation. Ever. Always re-fetch from backend.
 */
function invalidateCalendar(queryClient: ReturnType<typeof useQueryClient>) {
  // PHASE F4: Invalidate aggressively - all calendar-related queries
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
  // Also invalidate with camelCase variants
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
}

/**
 * Hook for creating a single planned session.
 * Automatically invalidates calendar queries on success.
 */
export function useCreatePlannedSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createManualSession,
    onSuccess: () => {
      invalidateCalendar(queryClient);
    },
  });
}

/**
 * Hook for creating a planned week (multiple sessions).
 * Automatically invalidates calendar queries on success.
 */
export function useCreatePlannedWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ weekStart, sessions }: { weekStart: string; sessions: Array<{
      date: string;
      type: 'easy' | 'workout' | 'long' | 'rest';
      distance_km?: number | null;
      duration_minutes?: number | null;
      notes?: string | null;
    }> }) => createManualWeek(weekStart, sessions),
    onSuccess: () => {
      invalidateCalendar(queryClient);
    },
  });
}

/**
 * Hook for updating a planned session's date.
 * Automatically invalidates calendar queries on success.
 */
export function useUpdatePlannedSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      scheduledDate,
      startTime,
      orderInDay,
    }: {
      sessionId: string;
      scheduledDate: string;
      startTime?: string | null;
      orderInDay?: number | null;
    }) => updatePlannedSessionDate(sessionId, scheduledDate, startTime, orderInDay),
    onSuccess: () => {
      invalidateCalendar(queryClient);
    },
  });
}

/**
 * Hook for updating a session's status (completed, skipped, cancelled).
 * Automatically invalidates calendar queries on success.
 * Returns the response which may be PROPOSAL_ONLY or the updated session.
 */
export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      status,
      completedActivityId,
      confirmed,
    }: {
      sessionId: string;
      status: 'completed' | 'skipped' | 'cancelled' | 'planned';
      completedActivityId?: string;
      confirmed?: boolean;
    }) => updateSessionStatus(sessionId, status, completedActivityId, confirmed),
    onSuccess: (response) => {
      // Only invalidate if not PROPOSAL_ONLY (which requires confirmation)
      // If it's PROPOSAL_ONLY, the caller will handle confirmation and call invalidateCalendar
      if (response && typeof response === 'object' && 'status' in response) {
        const writeResponse = response as WriteResponse<CalendarSession>;
        if (writeResponse.status === 'ok') {
          invalidateCalendar(queryClient);
        }
        // If status is 'PROPOSAL_ONLY', don't invalidate yet - wait for confirmation
      } else {
        // Direct CalendarSession response (not wrapped in WriteResponse)
        invalidateCalendar(queryClient);
      }
    },
  });
}

/**
 * PHASE F5: Hook for updating a workout's scheduled date via drag & drop.
 * Updates workout date via PATCH /workouts/{id}.
 * Backend handles session reorder and conflict resolution.
 * Frontend just re-fetches.
 */
export function useUpdateWorkoutDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      workoutId,
      scheduledDate,
    }: {
      workoutId: string;
      scheduledDate: string;
    }) => updateWorkoutDate(workoutId, scheduledDate),
    onSuccess: () => {
      invalidateCalendar(queryClient);
    },
  });
}
