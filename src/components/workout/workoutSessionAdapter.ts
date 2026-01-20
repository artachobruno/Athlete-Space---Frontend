/**
 * Workout Session Adapter
 *
 * Converts existing API types to WorkoutSession format for WorkoutSessionCard.
 * Single source of truth for data transformation.
 */

import type { CalendarSession } from '@/lib/api';
import type { CompletedActivity } from '@/types';
import type { WorkoutSession, WorkoutType, WorkoutPhase, WorkoutMetrics, CoachTone } from './types';

/**
 * Maps workout type/intensity string to WorkoutType enum
 */
function mapToWorkoutType(typeStr: string | null | undefined): WorkoutType {
  if (!typeStr) return 'easy';

  const lower = typeStr.toLowerCase();

  if (lower.includes('threshold') || lower.includes('tempo')) return 'threshold';
  if (lower.includes('interval') || lower.includes('vo2')) return 'interval';
  if (lower.includes('recovery') || lower.includes('easy')) return 'recovery';
  if (lower.includes('long') || lower.includes('endurance')) return 'long';

  return 'easy';
}

/**
 * Determines workout phase based on session status and activity presence
 */
function determinePhase(
  session: CalendarSession,
  activity: CompletedActivity | null | undefined
): WorkoutPhase {
  const hasCompleted = session.status === 'completed' || Boolean(activity);
  const hasPlanned = session.status === 'planned' || Boolean(session.duration_minutes);

  if (hasCompleted && hasPlanned) {
    return 'compliance';
  }
  if (hasCompleted) {
    return 'completed';
  }
  return 'planned';
}

/**
 * Converts session planned data to WorkoutMetrics
 */
function toPlannedMetrics(session: CalendarSession): WorkoutMetrics | undefined {
  const distanceKm = session.distance_km;
  const durationMin = session.duration_minutes;

  if (!distanceKm && !durationMin) return undefined;

  const durationSec = (durationMin ?? 0) * 60;
  const distance = distanceKm ?? 0;
  const paceSecPerKm = distance > 0 ? durationSec / distance : 0;

  return {
    distanceKm: distance,
    durationSec,
    paceSecPerKm,
  };
}

/**
 * Converts completed activity to WorkoutMetrics
 */
function toCompletedMetrics(activity: CompletedActivity | null | undefined): WorkoutMetrics | undefined {
  if (!activity) return undefined;

  const durationSec = (activity.duration ?? 0) * 60;
  const distanceKm = activity.distance ?? 0;
  const paceSecPerKm = distanceKm > 0 ? durationSec / distanceKm : 0;

  return {
    distanceKm,
    durationSec,
    paceSecPerKm,
  };
}

/**
 * Generates effort profile from pace stream or creates synthetic one
 */
function generateEffortData(
  paceStream: number[] | null | undefined,
  durationMinutes: number | null | undefined
): number[] {
  // If we have a pace stream, normalize it to 0-10 scale
  if (paceStream && paceStream.length > 0) {
    const minPace = Math.min(...paceStream);
    const maxPace = Math.max(...paceStream);
    const range = maxPace - minPace || 1;

    // Sample to ~12 bars
    const step = Math.max(1, Math.floor(paceStream.length / 12));
    const sampled: number[] = [];

    for (let i = 0; i < paceStream.length; i += step) {
      // Invert: faster pace = higher effort
      const normalized = 10 - ((paceStream[i] - minPace) / range) * 8;
      sampled.push(Math.max(1, Math.min(10, normalized)));
    }

    return sampled.slice(0, 12);
  }

  // Generate synthetic effort profile based on duration
  const duration = durationMinutes ?? 60;
  const segments = Math.min(12, Math.max(6, Math.floor(duration / 10)));

  return Array.from({ length: segments }, () => Math.floor(Math.random() * 5) + 3);
}

/**
 * Determines coach insight tone from feedback content
 */
function determineTone(feedback: string | null | undefined): CoachTone {
  if (!feedback) return 'neutral';

  const lower = feedback.toLowerCase();

  if (
    lower.includes('great') ||
    lower.includes('excellent') ||
    lower.includes('strong') ||
    lower.includes('good')
  ) {
    return 'positive';
  }

  if (
    lower.includes('caution') ||
    lower.includes('careful') ||
    lower.includes('warning') ||
    lower.includes('monitor') ||
    lower.includes('high')
  ) {
    return 'warning';
  }

  return 'neutral';
}

export interface ToWorkoutSessionOptions {
  /** The calendar session data */
  session: CalendarSession;
  /** Matched completed activity if available */
  activity?: CompletedActivity | null;
  /** Pace stream data from activity streams */
  paceStream?: number[] | null;
  /** Coach feedback or AI insight */
  coachFeedback?: string | null;
}

/**
 * Converts CalendarSession + optional activity to WorkoutSession
 */
export function toWorkoutSession(options: ToWorkoutSessionOptions): WorkoutSession {
  const { session, activity, paceStream, coachFeedback } = options;

  const phase = determinePhase(session, activity);
  const workoutType = mapToWorkoutType(session.type || session.intensity);

  const planned = toPlannedMetrics(session);
  const completed = toCompletedMetrics(activity);

  // Generate effort data
  const effortData = phase !== 'planned'
    ? generateEffortData(paceStream, activity?.duration)
    : undefined;

  const plannedEffortData = planned
    ? generateEffortData(null, session.duration_minutes)
    : undefined;

  // Coach insight
  const feedback = coachFeedback || activity?.coachFeedback || session.notes;
  const coachInsight = feedback
    ? { tone: determineTone(feedback), message: feedback }
    : undefined;

  return {
    id: session.id,
    type: workoutType,
    phase,
    planned,
    completed,
    effortData,
    plannedEffortData,
    coachInsight,
  };
}

/**
 * Creates a planned-only WorkoutSession for training plan views
 */
export function toPlannedWorkoutSession(
  id: string,
  typeStr: string,
  distanceKm: number,
  durationMinutes: number,
  recommendation?: string
): WorkoutSession {
  const paceSecPerKm = distanceKm > 0 ? (durationMinutes * 60) / distanceKm : 0;

  return {
    id,
    type: mapToWorkoutType(typeStr),
    phase: 'planned',
    planned: {
      distanceKm,
      durationSec: durationMinutes * 60,
      paceSecPerKm,
    },
    plannedEffortData: generateEffortData(null, durationMinutes),
    coachInsight: recommendation
      ? { tone: 'neutral', message: recommendation }
      : undefined,
  };
}

/**
 * Converts CalendarItem to WorkoutSession for calendar views
 */
export interface CalendarItemLike {
  id: string;
  kind: 'planned' | 'completed';
  intent: string;
  durationMin: number;
  distanceKm?: number;
  pace?: string;
  compliance?: 'complete' | 'partial' | 'missed';
  coachNote?: {
    text: string;
    tone: 'warning' | 'encouragement' | 'neutral';
  };
  description?: string;
}

function mapCalendarToneToCoachTone(tone: 'warning' | 'encouragement' | 'neutral'): CoachTone {
  if (tone === 'encouragement') return 'positive';
  if (tone === 'warning') return 'warning';
  return 'neutral';
}

export function calendarItemToWorkoutSession(item: CalendarItemLike): WorkoutSession {
  const durationSec = item.durationMin * 60;
  const distanceKm = item.distanceKm ?? 0;
  const paceSecPerKm = distanceKm > 0 ? durationSec / distanceKm : 0;

  // Determine phase based on kind and compliance
  let phase: WorkoutPhase = 'planned';
  if (item.kind === 'completed') {
    phase = item.compliance ? 'compliance' : 'completed';
  }

  const metrics: WorkoutMetrics = {
    distanceKm,
    durationSec,
    paceSecPerKm,
  };

  // For compliance mode, we'll use the same metrics for both planned and completed
  // In a real scenario, you'd have separate planned vs actual data
  const planned = phase === 'planned' || phase === 'compliance' ? metrics : undefined;
  const completed = phase === 'completed' || phase === 'compliance' ? metrics : undefined;

  // Coach insight from coachNote or description
  let coachInsight: WorkoutSession['coachInsight'] = undefined;
  if (item.coachNote) {
    coachInsight = {
      tone: mapCalendarToneToCoachTone(item.coachNote.tone),
      message: item.coachNote.text,
    };
  } else if (item.description) {
    coachInsight = {
      tone: 'neutral',
      message: item.description,
    };
  }

  return {
    id: item.id,
    type: mapToWorkoutType(item.intent),
    phase,
    planned,
    completed,
    effortData: phase !== 'planned' ? generateEffortData(null, item.durationMin) : undefined,
    plannedEffortData: generateEffortData(null, item.durationMin),
    coachInsight,
  };
}
