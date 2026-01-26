/**
 * Calendar Adapter
 * 
 * Converts backend types (CalendarSession, CompletedActivity) to frontend CalendarItem.
 * This is the ONLY place where backend types are accessed directly.
 * All UI components work with CalendarItem only.
 */

/**
 * Calendar Adapter
 * 
 * Converts backend types (CalendarSession, CompletedActivity) to frontend CalendarItem.
 * This is the ONLY place where backend types are accessed directly.
 * All UI components work with CalendarItem only.
 * 
 * Uses canonical coach vocabulary for workout titles (shared language layer).
 */
import { CalendarItem, CalendarCompliance, normalizeCalendarSport, normalizeCalendarIntent } from '@/types/calendar';
import { CalendarSession } from '@/lib/api';
import { CompletedActivity } from '@/types';
import { resolveWorkoutDisplayName } from '@/utils/resolveWorkoutDisplayName';
import type { CoachVocabularyLevel } from '@/types/vocabulary';

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
 * Uses canonical coach vocabulary to resolve workout titles.
 * This ensures consistent language across UI cards, narratives, and LLM responses.
 * 
 * @param session - Backend calendar session
 * @param activities - Array of completed activities for matching/compliance
 * @param vocabularyLevel - Optional coach vocabulary level (defaults to 'intermediate')
 * @returns CalendarItem for UI display
 */
export function toCalendarItem(
  session: CalendarSession,
  activities: CompletedActivity[],
  vocabularyLevel?: CoachVocabularyLevel | null
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
  // Priority: 1) planned_session_id (most reliable), 2) completed_activity_id, 3) workout_id
  // But don't rely on this for determining completion status
  let matchedActivity = activities.find(a => 
    a.planned_session_id === session.id
  );
  
  // Fallback: match by completed_activity_id if no planned_session_id match
  if (!matchedActivity && session.completed_activity_id) {
    matchedActivity = activities.find(a => 
      a.id === session.completed_activity_id
    );
  }
  
  // Final fallback: match by workout_id
  if (!matchedActivity && session.workout_id) {
    matchedActivity = activities.find(a => 
      a.workout_id === session.workout_id
    );
  }
  
  // Debug logging for 01/24 pairing issues
  if (session.date && session.date.includes('2026-01-24') && session.completed_activity_id) {
    console.log('[CALENDAR_ADAPTER] 01/24 pairing check:', {
      sessionId: session.id,
      sessionDate: session.date,
      completed_activity_id: session.completed_activity_id,
      isPaired: !!session.completed_activity_id,
      matchedActivity: matchedActivity ? {
        id: matchedActivity.id,
        date: matchedActivity.date,
        planned_session_id: matchedActivity.planned_session_id,
      } : null,
      activitiesCount: activities.length,
      activitiesWithPlannedSessionId: activities.filter(a => a.planned_session_id === session.id).length,
    });
  }

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

  const elevation = matchedActivity?.elevation;
  const hr = matchedActivity?.avgHeartRate;
  
  // Extract cadence from activity if available
  const cadence = matchedActivity?.avgCadence;

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

  const sport = normalizeCalendarSport(session.type, session.title);
  const intent = normalizeCalendarIntent(session.intensity);
  
  const resolvedTitle = resolveWorkoutDisplayName({
    sport,
    intent,
    vocabularyLevel,
  });

  // Extract duration: prefer activity data (actual execution), fall back to session planned duration
  const durationMin = matchedActivity?.duration ?? session.duration_minutes ?? 0;

  return {
    id: session.id,
    kind,
    sport,
    intent,
    title: resolvedTitle,
    startLocal,
    durationMin,
    load,
    distanceKm,
    pace,
    secondary,
    elevation,
    hr,
    cadence,
    isPaired,
    compliance,
    description: session.notes || undefined,
    executionNotes: session.execution_notes || undefined,
    mustDos: session.must_dos || undefined,
    coachNote,
  };
}
