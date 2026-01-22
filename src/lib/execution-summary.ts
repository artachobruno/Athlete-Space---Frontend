import { isBefore, isAfter, parseISO, startOfToday } from 'date-fns';
import type { CalendarSession } from '@/lib/api';
import type { CompletedActivity } from '@/types';
import type { ExecutionSummary, ExecutionState } from '@/types/execution';

/**
 * Compute execution state from planned session and activity.
 * 
 * Hard rules:
 * - Cancelled planned sessions are excluded entirely
 * - MISSED: planned exists, no activity, date < today
 * - PLANNED_ONLY: planned exists, no activity, date >= today
 * - COMPLETED_UNPLANNED: activity exists, no planned
 * - COMPLETED_AS_PLANNED: both exist and paired
 */
export function computeExecutionState(
  planned: CalendarSession | undefined,
  activity: CompletedActivity | undefined,
  date: string
): ExecutionState {
  // Exclude cancelled planned sessions
  if (planned?.status === 'cancelled' || planned?.status === 'deleted') {
    // If cancelled, treat as if it doesn't exist
    if (activity) {
      return 'COMPLETED_UNPLANNED';
    }
    // No activity, no valid planned = no summary (should be filtered out)
    return 'PLANNED_ONLY'; // Fallback, but should be filtered
  }

  const dateObj = parseISO(date);
  const today = startOfToday();

  // Both exist and paired
  if (planned && activity) {
    // Check if they're paired (activity has planned_session_id matching planned.id)
    const isPaired = activity.planned_session_id === planned.id;
    if (isPaired) {
      return 'COMPLETED_AS_PLANNED';
    }
    // If both exist but not paired, treat activity as unplanned
    return 'COMPLETED_UNPLANNED';
  }

  // Only activity exists
  if (activity && !planned) {
    return 'COMPLETED_UNPLANNED';
  }

  // Only planned exists
  if (planned && !activity) {
    if (isBefore(dateObj, today)) {
      return 'MISSED';
    }
    return 'PLANNED_ONLY';
  }

  // Neither exists (shouldn't happen, but fallback)
  return 'PLANNED_ONLY';
}

/**
 * Compute deltas between planned and completed.
 * Only valid when executionState is COMPLETED_AS_PLANNED.
 */
export function computeDeltas(
  planned: CalendarSession,
  activity: CompletedActivity
): { durationSeconds?: number; distanceMeters?: number } {
  const deltas: { durationSeconds?: number; distanceMeters?: number } = {};

  // Duration delta (in seconds)
  if (planned.duration_minutes && activity.duration) {
    const plannedSeconds = planned.duration_minutes * 60;
    const completedSeconds = activity.duration * 60;
    deltas.durationSeconds = completedSeconds - plannedSeconds;
  }

  // Distance delta (in meters)
  if (planned.distance_km && activity.distance) {
    const plannedMeters = planned.distance_km * 1000;
    const completedMeters = activity.distance * 1000;
    deltas.distanceMeters = completedMeters - plannedMeters;
  }

  return deltas;
}

/**
 * Build execution summaries for a given day.
 * 
 * Rules:
 * - One summary per planned session (even if unpaired)
 * - One summary per unpaired activity
 * - Paired items become one summary
 * - Cancelled planned sessions are excluded
 */
export function buildExecutionSummaries(
  date: string,
  plannedSessions: CalendarSession[],
  activities: CompletedActivity[]
): ExecutionSummary[] {
  const summaries: ExecutionSummary[] = [];
  const usedActivityIds = new Set<string>();
  const usedPlannedIds = new Set<string>();

  // Build pairing maps for efficient lookup
  // Map: activity_id -> planned_session_id (from activities)
  const activityToPlannedMap = new Map<string, string>();
  for (const activity of activities) {
    if (activity.planned_session_id && activity.date === date) {
      activityToPlannedMap.set(activity.id, activity.planned_session_id);
    }
  }

  // Map: planned_session_id -> activity_id (from planned sessions with completed_activity_id)
  const plannedToActivityMap = new Map<string, string>();
  for (const planned of plannedSessions) {
    if (planned.completed_activity_id && planned.date === date) {
      plannedToActivityMap.set(planned.id, planned.completed_activity_id);
    }
  }

  // First pass: Handle paired items
  for (const planned of plannedSessions) {
    // Skip cancelled/deleted
    if (planned.status === 'cancelled' || planned.status === 'deleted') {
      continue;
    }

    // Find paired activity (check both directions)
    let pairedActivity: CompletedActivity | undefined;
    
    // Check if planned has completed_activity_id
    if (planned.completed_activity_id) {
      pairedActivity = activities.find(
        (a) => a.id === planned.completed_activity_id && a.date === date
      );
    }
    
    // Also check if any activity has this planned_session_id
    if (!pairedActivity) {
      pairedActivity = activities.find(
        (a) => a.planned_session_id === planned.id && a.date === date
      );
    }

    if (pairedActivity) {
      const executionState = computeExecutionState(planned, pairedActivity, date);
      const deltas =
        executionState === 'COMPLETED_AS_PLANNED'
          ? computeDeltas(planned, pairedActivity)
          : undefined;

      summaries.push({
        planned,
        activity: pairedActivity,
        executionState,
        deltas,
        date,
      });

      usedActivityIds.add(pairedActivity.id);
      usedPlannedIds.add(planned.id);
    }
  }

  // Second pass: Handle unpaired planned sessions
  for (const planned of plannedSessions) {
    if (usedPlannedIds.has(planned.id)) continue;
    if (planned.status === 'cancelled' || planned.status === 'deleted') continue;

    const executionState = computeExecutionState(planned, undefined, date);
    summaries.push({
      planned,
      executionState,
      date,
    });
  }

  // Third pass: Handle unpaired activities
  for (const activity of activities) {
    if (usedActivityIds.has(activity.id)) continue;
    if (activity.date !== date) continue;

    const executionState = computeExecutionState(undefined, activity, date);
    summaries.push({
      activity,
      executionState,
      date,
    });
  }

  return summaries;
}
