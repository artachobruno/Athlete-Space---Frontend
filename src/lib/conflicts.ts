/**
 * Client-side conflict detection utilities
 * 
 * Note: This is a frontend-only implementation. Full conflict resolution
 * (A86.1-A86.5) should be implemented in the backend.
 */

import type { CalendarSession } from './api';

export interface Conflict {
  date: string;
  existing_session_id: string;
  existing_session_title: string;
  candidate_session_id?: string;
  candidate_session_title?: string;
  reason: 'time_overlap' | 'all_day_overlap' | 'multiple_key_sessions';
}

export interface SessionTimeRange {
  date: string;
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
}

/**
 * Converts a CalendarSession to a time range for conflict detection
 */
export function sessionToTimeRange(session: CalendarSession): SessionTimeRange {
  // If session has time, use it; otherwise it's all-day
  const hasTime = session.time !== null && session.time !== undefined && session.time !== '';
  const isAllDay = !hasTime;

  let startTime: string | null = null;
  let endTime: string | null = null;

  if (hasTime && session.time) {
    startTime = session.time;
    // Calculate end time from duration (if available)
    if (session.duration_minutes) {
      const startDate = new Date(`${session.date}T${session.time}`);
      const endDate = new Date(startDate.getTime() + session.duration_minutes * 60 * 1000);
      endTime = endDate.toTimeString().slice(0, 5); // HH:MM format
    }
  }

  return {
    date: session.date,
    start_time: startTime,
    end_time: endTime,
    is_all_day: isAllDay,
  };
}

/**
 * Checks if two time ranges overlap
 */
export function timeRangesOverlap(
  range1: SessionTimeRange,
  range2: SessionTimeRange
): boolean {
  // Same date required
  if (range1.date !== range2.date) {
    return false;
  }

  // If either is all-day, they conflict
  if (range1.is_all_day || range2.is_all_day) {
    return true;
  }

  // Both have times - check overlap
  if (!range1.start_time || !range2.start_time) {
    return false;
  }

  const start1 = timeToMinutes(range1.start_time);
  const end1 = range1.end_time ? timeToMinutes(range1.end_time) : start1 + 60; // Default 1 hour
  const start2 = timeToMinutes(range2.start_time);
  const end2 = range2.end_time ? timeToMinutes(range2.end_time) : start2 + 60; // Default 1 hour

  // Check if ranges overlap
  return !(end1 <= start2 || end2 <= start1);
}

/**
 * Converts time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Checks if a session is a "key session" (workout or long run)
 */
export function isKeySession(type: string): boolean {
  return type === 'workout' || type === 'long';
}

/**
 * Detects conflicts between existing sessions and candidate sessions
 * 
 * @param existingSessions - Sessions already in the calendar
 * @param candidateSessions - New sessions being added
 * @returns List of conflicts found
 */
export function detectConflicts(
  existingSessions: CalendarSession[],
  candidateSessions: Array<{
    date: string;
    type: string;
    time?: string | null;
    duration_minutes?: number | null;
    id?: string;
    title?: string;
  }>
): Conflict[] {
  const conflicts: Conflict[] = [];

  // Convert existing sessions to time ranges
  const existingRanges = existingSessions.map(session => ({
    session,
    range: sessionToTimeRange(session),
  }));

  // Check each candidate against existing sessions
  for (const candidate of candidateSessions) {
    const candidateRange: SessionTimeRange = {
      date: candidate.date,
      start_time: candidate.time || null,
      end_time: candidate.time && candidate.duration_minutes
        ? calculateEndTime(candidate.time, candidate.duration_minutes)
        : null,
      is_all_day: !candidate.time || candidate.time === '',
    };

    // Check for conflicts with existing sessions on the same date
    for (const { session, range } of existingRanges) {
      if (range.date === candidateRange.date) {
        // Check time overlap
        if (timeRangesOverlap(range, candidateRange)) {
          conflicts.push({
            date: candidate.date,
            existing_session_id: session.id,
            existing_session_title: session.title,
            candidate_session_id: candidate.id,
            candidate_session_title: candidate.title || `${candidate.type} session`,
            reason: range.is_all_day || candidateRange.is_all_day
              ? 'all_day_overlap'
              : 'time_overlap',
          });
        }
      }
    }
  }

  // Check for multiple key sessions on same day (across all candidates)
  const keySessionsByDate = new Map<string, Array<{ session: CalendarSession | { id?: string; date: string; type: string; title?: string }; isCandidate: boolean }>>();
  
  // Add existing key sessions
  for (const session of existingSessions) {
    if (isKeySession(session.type)) {
      if (!keySessionsByDate.has(session.date)) {
        keySessionsByDate.set(session.date, []);
      }
      keySessionsByDate.get(session.date)!.push({ session, isCandidate: false });
    }
  }
  
  // Add candidate key sessions
  for (const candidate of candidateSessions) {
    if (isKeySession(candidate.type)) {
      if (!keySessionsByDate.has(candidate.date)) {
        keySessionsByDate.set(candidate.date, []);
      }
      keySessionsByDate.get(candidate.date)!.push({ 
        session: { 
          id: candidate.id, 
          date: candidate.date, 
          type: candidate.type, 
          title: candidate.title 
        }, 
        isCandidate: true 
      });
    }
  }
  
  // Flag dates with multiple key sessions
  for (const [date, sessions] of keySessionsByDate.entries()) {
    if (sessions.length > 1) {
      const existingKeySessions = sessions.filter(s => !s.isCandidate);
      const candidateKeySessions = sessions.filter(s => s.isCandidate);
      
      if (existingKeySessions.length > 0 && candidateKeySessions.length > 0) {
        // Check if we already flagged this as a time overlap
        const existingSession = existingKeySessions[0].session as CalendarSession;
        for (const candidateKeySession of candidateKeySessions) {
          const alreadyFlagged = conflicts.some(
            c => c.date === date &&
                 c.existing_session_id === existingSession.id &&
                 c.candidate_session_id === candidateKeySession.session.id
          );
          if (!alreadyFlagged) {
            conflicts.push({
              date,
              existing_session_id: existingSession.id,
              existing_session_title: existingSession.title,
              candidate_session_id: candidateKeySession.session.id,
              candidate_session_title: candidateKeySession.session.title || `${candidateKeySession.session.type} session`,
              reason: 'multiple_key_sessions',
            });
          }
        }
      }
    }
  }

  // Remove duplicates (same date + same sessions)
  const uniqueConflicts: Conflict[] = [];
  const seen = new Set<string>();
  for (const conflict of conflicts) {
    const key = `${conflict.date}-${conflict.existing_session_id}-${conflict.candidate_session_id || 'new'}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueConflicts.push(conflict);
    }
  }

  return uniqueConflicts;
}

/**
 * Calculates end time from start time and duration
 */
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
  return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
}
