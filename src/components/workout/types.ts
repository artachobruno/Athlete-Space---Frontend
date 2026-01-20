/**
 * Workout Session Card Types
 *
 * Single source of truth for WorkoutSessionCard component types.
 * Used across dashboard, calendar, and training plan views.
 */

export type WorkoutPhase = 'planned' | 'completed' | 'compliance';

export type WorkoutType = 'threshold' | 'interval' | 'recovery' | 'long' | 'easy' | 'tempo';

export type CoachTone = 'neutral' | 'positive' | 'warning';

export interface WorkoutMetrics {
  distanceKm: number;
  durationSec: number;
  paceSecPerKm: number;
}

export interface CoachInsightData {
  tone: CoachTone;
  message: string;
}

export interface WorkoutSession {
  id: string;
  type: WorkoutType;
  phase: WorkoutPhase;

  planned?: WorkoutMetrics;
  completed?: WorkoutMetrics;

  effortData?: number[];
  plannedEffortData?: number[];

  coachInsight?: CoachInsightData;
}
