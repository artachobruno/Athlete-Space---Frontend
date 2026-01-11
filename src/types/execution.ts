/**
 * Phase 6B: Execution & Conflict UX Types
 * 
 * These types are used for the execution preview and conflict detection flow.
 * Frontend never mutates plans - backend is the single source of truth.
 */

/**
 * Session within a week plan for execution preview
 */
export interface PlanSession {
  session_id: string;
  date: string; // Resolved date (YYYY-MM-DD)
  type: 'easy' | 'tempo' | 'long' | 'workout' | 'recovery' | 'rest';
  duration: number; // minutes
  distance?: number; // km (derived miles)
  template_name: string; // Human readable template name
  notes?: string; // Coach text
}

/**
 * Week plan for execution (from Phase 5)
 */
export interface WeekPlan {
  week: number; // Week number (1-based)
  weekStart: string; // Week start date (YYYY-MM-DD)
  weekEnd: string; // Week end date (YYYY-MM-DD)
  sessions: PlanSession[];
  coachNotes?: string;
}

/**
 * Conflict detected during execution preview
 */
export interface ExecutionConflict {
  session_id: string;
  existing_session_id: string;
  date: string; // YYYY-MM-DD
  reason: 'overlap' | 'manual_edit';
}

/**
 * Execution preview response from backend
 */
export interface ExecutionPreviewResponse {
  conflicts: ExecutionConflict[];
}

/**
 * Execution response from backend
 */
export interface ExecutionResponse {
  status: 'success' | 'error';
  message?: string;
  sessions_created?: number;
  weeks_affected?: number;
}
