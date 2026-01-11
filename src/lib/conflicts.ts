/**
 * Conflict types for frontend display (A86.6)
 * 
 * NOTE: A86.0-A86.5 are BACKEND tasks:
 * - Conflict detection logic (A86.2)
 * - Auto-shift algorithm (A86.4)  
 * - API blocking behavior (A86.5)
 * - All conflict checks for manual uploads (A91/A92/A93 safety)
 * 
 * Frontend only handles A86.6: UI display of conflicts returned by backend.
 * These types match the expected backend API response format.
 */

/**
 * Conflict object returned by backend API
 * Matches backend Conflict model from A86.2
 */
export interface Conflict {
  date: string; // YYYY-MM-DD
  existing_session_id: string;
  candidate_session_id: string;
  reason: 'time_overlap' | 'all_day_overlap' | 'multiple_key_sessions';
}

/**
 * Conflict detection response from backend
 * Returned when status is "conflict_detected"
 */
export interface ConflictResponse {
  status: 'conflict_detected';
  conflicts: Conflict[];
  options?: Array<'auto_shift' | 'manual_review'>;
}
