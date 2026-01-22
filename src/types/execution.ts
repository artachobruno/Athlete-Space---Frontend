import type { CalendarSession } from '@/lib/api';
import type { CompletedActivity } from '@/types';

/**
 * Canonical execution states (derived, not stored).
 * Represents the relationship between planned sessions and completed activities.
 */
export type ExecutionState =
  | 'PLANNED_ONLY'
  | 'COMPLETED_AS_PLANNED'
  | 'COMPLETED_UNPLANNED'
  | 'MISSED';

/**
 * Execution summary combining planned session and completed activity.
 * This is the canonical representation for schedule rendering.
 */
export interface ExecutionSummary {
  /** Planned session (if exists) */
  planned?: CalendarSession;
  /** Completed activity (if exists) */
  activity?: CompletedActivity;
  /** Derived execution state */
  executionState: ExecutionState;
  /** Deltas between planned and completed (only when COMPLETED_AS_PLANNED) */
  deltas?: {
    durationSeconds?: number;
    distanceMeters?: number;
  };
  /** Date of this execution summary */
  date: string;
}

/**
 * Color mapping for execution states.
 * Used globally for consistent visual representation.
 */
export const EXECUTION_STATE_COLORS: Record<ExecutionState, string> = {
  PLANNED_ONLY: 'text-muted-foreground', // Gray/Blue
  COMPLETED_AS_PLANNED: 'text-green-600 dark:text-green-400', // Green
  COMPLETED_UNPLANNED: 'text-amber-600 dark:text-amber-400', // Amber/Orange
  MISSED: 'text-red-600 dark:text-red-400', // Red/Muted
};

export const EXECUTION_STATE_BG_COLORS: Record<ExecutionState, string> = {
  PLANNED_ONLY: 'bg-muted/20',
  COMPLETED_AS_PLANNED: 'bg-green-500/10',
  COMPLETED_UNPLANNED: 'bg-amber-500/10',
  MISSED: 'bg-red-500/10',
};
