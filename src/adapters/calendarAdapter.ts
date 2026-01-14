/**
 * Calendar Adapter
 * 
 * Converts backend types (CalendarSession, CompletedActivity) to frontend CalendarItem.
 * This is the ONLY place where backend types are accessed directly.
 * All UI components work with CalendarItem only.
 */

import { CalendarItem, CalendarCompliance, normalizeCalendarSport, normalizeCalendarIntent } from '@/types/calendar';
import { CalendarSession } from '@/lib/api';
import { CompletedActivity } from '@/types';

/**
 * Converts a CalendarSession to a CalendarItem.
 * 
 * @param session - Backend calendar session
 * @param activities - Array of completed activities for matching/compliance
 * @returns CalendarItem for UI display
 */
export function toCalendarItem(
  session: CalendarSession,
  activities: CompletedActivity[]
): CalendarItem {
  // Find matching activity for compliance
  const matchedActivity = activities.find(a => 
    a.planned_session_id === session.id ||
    (session.workout_id && a.workout_id === session.workout_id)
  );

  const kind = (matchedActivity || session.status === 'completed') ? 'completed' : 'planned';
  const isPaired = !!matchedActivity || !!session.completed_activity_id;

  // Determine compliance for completed items
  let compliance: CalendarCompliance | undefined = undefined;
  if (kind === 'completed') {
    if (matchedActivity) {
      // If we have a matched activity, assume complete
      // In a real app, you might check activity metrics vs planned metrics
      compliance = 'complete';
    } else if (session.status === 'completed') {
      // Session marked as completed but no matching activity = partial or complete
      compliance = 'complete';
    }
  }

  // Extract load from activity if available
  const load = matchedActivity?.trainingLoad;

  // Extract secondary metric (pace, power, etc.) from activity
  let secondary: string | undefined = undefined;
  if (matchedActivity) {
    if (matchedActivity.avgPace) {
      secondary = matchedActivity.avgPace;
    } else if (matchedActivity.avgPower) {
      secondary = `${Math.round(matchedActivity.avgPower)}W`;
    } else if (matchedActivity.avgHeartRate) {
      secondary = `${matchedActivity.avgHeartRate} bpm`;
    }
  }

  // Build startLocal from date + time
  let startLocal = session.date;
  if (session.time) {
    startLocal = `${session.date}T${session.time}:00`;
  } else {
    // Default to start of day if no time
    startLocal = `${session.date}T00:00:00`;
  }

  return {
    id: session.id,
    kind,
    sport: normalizeCalendarSport(session.type),
    intent: normalizeCalendarIntent(session.intensity, session.type),
    title: session.title || '',
    startLocal,
    durationMin: session.duration_minutes || 0,
    load,
    secondary,
    isPaired,
    compliance,
  };
}
