/**
 * Workout Session Adapter
 *
 * Converts existing API types to WorkoutSession format for WorkoutSessionCard.
 * Single source of truth for data transformation.
 *
 * ❗ DO NOT PARSE WORKOUTS FROM TEXT
 * All workout structure must come from workout.steps
 * Never use regex, split(), match(), or pattern logic to extract workout data
 */

import type { CalendarSession, ActivityStreamsResponse } from '@/lib/api';
import type { CompletedActivity } from '@/types';
import type { CalendarItem } from '@/types/calendar';
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
 * Generates a display title for workout type
 */
function getDefaultTitle(type: WorkoutType): string {
  const titles: Record<WorkoutType, string> = {
    threshold: 'Threshold Run',
    interval: 'Interval Session',
    recovery: 'Recovery Run',
    long: 'Long Run',
    easy: 'Easy Run',
    tempo: 'Tempo Run',
  };
  return titles[type] || 'Workout';
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
 * Generates effort profile from pace/heart rate stream data
 */
function generateEffortFromStream(
  streams: ActivityStreamsResponse | null | undefined,
  numBars: number = 10
): number[] {
  if (!streams) return [];

  // Prefer heart rate for effort visualization, fall back to pace
  const dataStream = streams.heartrate || streams.pace;
  if (!dataStream || dataStream.length === 0) return [];

  // Sample the stream to the target number of bars
  const step = Math.max(1, Math.floor(dataStream.length / numBars));
  const sampled: number[] = [];

  for (let i = 0; i < dataStream.length && sampled.length < numBars; i += step) {
    const value = dataStream[i];
    if (value !== null && value !== undefined) {
      sampled.push(value);
    }
  }

  if (sampled.length === 0) return [];

  // Normalize to 1-10 scale
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const range = max - min || 1;

  return sampled.map(v => {
    // For heart rate: higher = more effort
    // For pace: lower = more effort (faster), so we invert
    const isHeartRate = Boolean(streams.heartrate);
    const normalized = isHeartRate
      ? 1 + ((v - min) / range) * 9
      : 10 - ((v - min) / range) * 9;
    return Math.max(1, Math.min(10, Math.round(normalized)));
  });
}

/**
 * Generates synthetic effort profile for planned workouts (when no real data)
 */
function generatePlannedEffort(intent: string, numBars: number = 10): number[] {
  // Create effort profile based on workout intent
  const lower = (intent || '').toLowerCase();
  
  if (lower.includes('interval') || lower.includes('vo2')) {
    // Intervals: alternating high/low
    return Array.from({ length: numBars }, (_, i) => 
      i % 2 === 0 ? 3 + Math.random() * 2 : 7 + Math.random() * 2
    );
  }
  
  if (lower.includes('tempo') || lower.includes('threshold')) {
    // Tempo: warmup, sustained effort, cooldown
    return Array.from({ length: numBars }, (_, i) => {
      if (i < 2) return 3 + Math.random() * 2; // warmup
      if (i >= numBars - 2) return 3 + Math.random() * 2; // cooldown
      return 6 + Math.random() * 2; // sustained
    });
  }
  
  if (lower.includes('long')) {
    // Long run: gradual build, steady, slight fade
    return Array.from({ length: numBars }, (_, i) => {
      const progress = i / numBars;
      if (progress < 0.2) return 4 + progress * 5;
      if (progress > 0.8) return 5 + (1 - progress) * 3;
      return 5 + Math.random() * 1.5;
    });
  }
  
  // Easy/recovery: flat, low effort
  return Array.from({ length: numBars }, () => 3 + Math.random() * 2);
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
  /** Activity streams for effort graph */
  streams?: ActivityStreamsResponse | null;
  /** Coach feedback or AI insight */
  coachFeedback?: string | null;
}

/**
 * Converts CalendarSession + optional activity to WorkoutSession
 */
export function toWorkoutSession(options: ToWorkoutSessionOptions): WorkoutSession {
  const { session, activity, streams, coachFeedback } = options;

  const phase = determinePhase(session, activity);
  const workoutType = mapToWorkoutType(session.type || session.intensity);

  // Determine title: use session title, activity title, or generate from type
  const title = session.title || activity?.title || getDefaultTitle(workoutType);

  const planned = toPlannedMetrics(session);
  const completed = toCompletedMetrics(activity);

  // Generate effort data from real streams if available
  const effortData = phase !== 'planned'
    ? generateEffortFromStream(streams)
    : undefined;

  // Generate planned effort profile based on workout intent
  const plannedEffortData = generatePlannedEffort(session.intensity || session.type || 'easy');

  // Coach insight
  const feedback = coachFeedback || activity?.coachFeedback || session.notes;
  const coachInsight = feedback
    ? { tone: determineTone(feedback), message: feedback }
    : undefined;

  return {
    id: session.id,
    title,
    type: workoutType,
    phase,
    planned,
    completed,
    effortData: effortData && effortData.length > 0 ? effortData : plannedEffortData,
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
  recommendation?: string,
  title?: string
): WorkoutSession {
  const paceSecPerKm = distanceKm > 0 ? (durationMinutes * 60) / distanceKm : 0;
  const workoutType = mapToWorkoutType(typeStr);

  return {
    id,
    title: title || getDefaultTitle(workoutType),
    type: workoutType,
    phase: 'planned',
    planned: {
      distanceKm,
      durationSec: durationMinutes * 60,
      paceSecPerKm,
    },
    plannedEffortData: generatePlannedEffort(typeStr),
    coachInsight: recommendation
      ? { tone: 'neutral', message: recommendation }
      : undefined,
  };
}

/**
 * Converts CalendarItem to WorkoutSession for calendar views
 * Uses real data from the CalendarItem which already contains backend data
 */
export function calendarItemToWorkoutSession(
  item: CalendarItem,
  streams?: ActivityStreamsResponse | null
): WorkoutSession {
  const durationSec = item.durationMin * 60;
  const distanceKm = item.distanceKm ?? 0;
  
  // Parse pace from formatted string if available (e.g., "5:30 /km")
  let paceSecPerKm = 0;
  if (item.pace) {
    const match = item.pace.match(/(\d+):(\d+)/);
    if (match) {
      paceSecPerKm = parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
    }
  } else if (distanceKm > 0) {
    paceSecPerKm = durationSec / distanceKm;
  }

  // Determine phase based on kind and compliance
  let phase: WorkoutPhase = 'planned';
  if (item.kind === 'completed') {
    phase = item.compliance === 'complete' || item.isPaired ? 'compliance' : 'completed';
  }

  const workoutType = mapToWorkoutType(item.intent);
  
  // Use item title, fall back to generated title from type
  const title = item.title || getDefaultTitle(workoutType);

  const metrics: WorkoutMetrics = {
    distanceKm,
    durationSec,
    paceSecPerKm,
  };

  // For compliance mode, we use the same metrics (real data from completed activity)
  const planned = phase === 'planned' || phase === 'compliance' ? metrics : undefined;
  const completed = phase === 'completed' || phase === 'compliance' ? metrics : undefined;

  // Generate effort data from real streams if available
  const effortData = phase !== 'planned' && streams
    ? generateEffortFromStream(streams)
    : undefined;

  // Generate planned effort profile based on intent
  const plannedEffortData = generatePlannedEffort(item.intent);

  // Coach insight from coachNote or description
  let coachInsight: WorkoutSession['coachInsight'] = undefined;
  if (item.coachNote) {
    const tone: CoachTone = item.coachNote.tone === 'encouragement' 
      ? 'positive' 
      : item.coachNote.tone === 'warning' 
        ? 'warning' 
        : 'neutral';
    coachInsight = { tone, message: item.coachNote.text };
  } else if (item.description) {
    coachInsight = { tone: 'neutral', message: item.description };
  }

  return {
    id: item.id,
    title,
    type: workoutType,
    phase,
    planned,
    completed,
    effortData: effortData && effortData.length > 0 ? effortData : plannedEffortData,
    plannedEffortData,
    coachInsight,
    executionNotes: item.executionNotes || undefined,
  };
}
