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
 * Capitalizes all words in a title (title case).
 * Example: "long run" -> "Long Run", "TEMPO RUN" -> "Tempo Run"
 */
export function capitalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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
  // CRITICAL: Determine completion based on planned_sessions fields ONLY
  // Check all completion indicators to be robust to inconsistent data:
  // - status === 'completed' (authoritative)
  // - completed === true (boolean flag)
  // - completed_at !== null (timestamp set)
  // - completed_activity_id !== null (external activity linked)
  // Note: completed_activity_id is an external ID (likely Strava activity ID) and may not match
  // anything in the completed_activities array. We must rely on session fields only.
  const isCompleted =
    session.status === 'completed' ||
    session.completed === true ||
    !!session.completed_at ||
    !!session.completed_activity_id;
  const kind = isCompleted ? 'completed' : 'planned';
  const isPaired = !!session.completed_activity_id;

  // Try to find matching activity for metrics (pace, power, HR, load, coachFeedback) if available
  // Match by: planned_session_id, workout_id, or completed_activity_id (external ID)
  // But don't rely on this for determining completion status
  const matchedActivity = activities.find(a => 
    a.planned_session_id === session.id ||
    (session.workout_id && a.workout_id === session.workout_id) ||
    (session.completed_activity_id && a.id === session.completed_activity_id)
  );

  // Determine compliance
  // If status is 'missed', set compliance='missed' even if kind is 'planned'
  // This allows UI to show "MISSED" label without changing card base kind
  let compliance: CalendarCompliance | undefined = undefined;
  if (session.status === 'missed') {
    // Status can be 'missed' from reconciliation
    compliance = 'missed';
  } else if (isCompleted) {
    compliance = 'complete';
  }

  // Extract load from activity if available, otherwise undefined
  const load = matchedActivity?.trainingLoad;

  // Extract distance: prefer activity data, fall back to session planned distance
  let distanceKm: number | undefined = undefined;
  if (matchedActivity?.distance) {
    distanceKm = matchedActivity.distance;
  } else if (session.distance_km) {
    distanceKm = session.distance_km;
  }

  // Extract pace from activity if available
  const pace = matchedActivity?.avgPace;

  // Extract secondary metric (power, HR, etc.) from activity if available
  // Pace is now a separate field, so use other metrics for secondary
  let secondary: string | undefined = undefined;
  if (matchedActivity) {
    if (matchedActivity.avgPower) {
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

  // Map coach feedback/insight to coachNote
  // Priority for completed: matched activity coachFeedback > session coach_insight
  // Priority for planned: session coach_insight
  let coachNote: { text: string; tone: 'warning' | 'encouragement' | 'neutral' } | undefined = undefined;
  
  if (isCompleted) {
    // Completed activity: prefer coachFeedback from matched activity, fallback to session coach_insight
    // Also check all activities for this session ID in case matching failed
    const feedbackFromMatched = matchedActivity?.coachFeedback;
    const feedbackFromSession = session.coach_insight;
    // Fallback: search all activities for this session ID if matching failed
    const feedbackFromAnyActivity = !feedbackFromMatched && !feedbackFromSession
      ? activities.find(a => a.planned_session_id === session.id)?.coachFeedback
      : undefined;
    
    const feedbackText = feedbackFromMatched || feedbackFromSession || feedbackFromAnyActivity;
    
    if (feedbackText) {
      coachNote = {
        text: feedbackText,
        tone: 'neutral' as const, // Default tone - can be enhanced to detect from text
      };
      console.log('[CALENDAR_ADAPTER] Coach note for completed session:', {
        sessionId: session.id,
        hasCoachNote: !!coachNote,
        coachNoteText: coachNote.text.substring(0, 100),
      });
    }
  } else if (session.coach_insight) {
    // Planned session: use coach_insight from session
    coachNote = {
      text: session.coach_insight,
      tone: 'neutral' as const, // Default tone - can be enhanced to detect from text
    };
    console.log('[CALENDAR_ADAPTER] Coach note for planned session:', {
      sessionId: session.id,
      hasCoachNote: !!coachNote,
      coachNoteText: coachNote.text.substring(0, 100),
      sessionCoachInsight: session.coach_insight?.substring(0, 100),
    });
  } else {
    console.log('[CALENDAR_ADAPTER] No coach note:', {
      sessionId: session.id,
      isCompleted,
      hasCoachInsight: !!session.coach_insight,
      coachInsightValue: session.coach_insight,
    });
  }

  return {
    id: session.id,
    kind,
    sport: normalizeCalendarSport(session.type, session.title),
    intent: normalizeCalendarIntent(session.intensity),
    title: capitalizeTitle(session.title || ''),
    startLocal,
    durationMin: session.duration_minutes || 0,
    load,
    distanceKm,
    pace,
    secondary,
    isPaired,
    compliance,
    description: session.notes || undefined,
    executionNotes: session.execution_notes || undefined,
    mustDos: session.must_dos || undefined,
    coachNote,
  };
}
