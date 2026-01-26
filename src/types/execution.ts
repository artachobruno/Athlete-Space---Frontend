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
 * LLM-generated coaching feedback (cached output).
 */
export interface LLMFeedback {
  text: string;
  tone: 'neutral' | 'encouraging' | 'corrective';
  generated_at: string; // ISO 8601 timestamp
}

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
  /** LLM-generated coaching feedback (cached, optional) */
  llm_feedback?: LLMFeedback;
}

/**
 * Color mapping for execution states.
 * Used globally for consistent visual representation.
 */
export const EXECUTION_STATE_COLORS: Record<ExecutionState, string> = {
  PLANNED_ONLY: 'text-muted-foreground',
  COMPLETED_AS_PLANNED: 'text-green-600 dark:text-green-400',
  COMPLETED_UNPLANNED: 'text-amber-600 dark:text-amber-400',
  MISSED: 'text-red-600 dark:text-red-400',
};

export const EXECUTION_STATE_BG_COLORS: Record<ExecutionState, string> = {
  PLANNED_ONLY: 'bg-muted/20',
  COMPLETED_AS_PLANNED: 'bg-green-500/10',
  COMPLETED_UNPLANNED: 'bg-amber-500/10',
  MISSED: 'bg-red-500/10',
};

/**
 * Planning types for execution flow components.
 */
export interface PlanSession {
  id: string;
  session_id: string;
  date: string;
  type: string;
  template_name: string;
  duration: number;
  distance?: number;
  explanation?: string;
  rationale?: string;
  notes?: string;
}

export interface WeekPlan {
  week: number;
  week_number: number;
  weekStart: string;
  weekEnd: string;
  start_date: string;
  end_date: string;
  sessions: PlanSession[];
  phase?: string;
  focus?: string;
  coachNotes?: string;
}

export interface ExecutionConflict {
  date: string;
  type: 'overlap' | 'overload' | 'recovery';
  session_id: string;
  existing_session_id: string;
  reason: 'overlap' | 'manual_edit';
  message: string;
  severity: 'warning' | 'error';
}

export interface ExecutionResponse {
  success: boolean;
  message?: string;
  applied_sessions?: PlanSession[];
  sessions_created?: number;
  weeks_affected?: number;
}

export interface ExecutionPreviewResponse {
  weeks: WeekPlan[];
  conflicts: ExecutionConflict[];
  summary: {
    total_sessions: number;
    total_duration_minutes: number;
    total_distance_km?: number;
  };
}
