import type { WorkoutIntent } from '@/types';
import type { CalendarSession } from './api';

/**
 * Maps session intensity string to WorkoutIntent type.
 * Handles various intensity formats from the backend.
 */
export function mapIntensityToIntent(intensity: string | null | undefined): WorkoutIntent {
  if (!intensity || typeof intensity !== 'string') {
    return 'aerobic'; // Default fallback
  }

  const lower = intensity.toLowerCase().trim();

  // Direct matches
  if (lower === 'recovery' || lower === 'easy' || lower === 'rest') {
    return 'recovery';
  }
  if (lower === 'aerobic' || lower === 'base' || lower === 'zone2' || lower === 'zone 2') {
    return 'aerobic';
  }
  if (lower === 'threshold' || lower === 'tempo' || lower === 'zone4' || lower === 'zone 4') {
    return 'threshold';
  }
  if (lower === 'vo2' || lower === 'vo2max' || lower === 'interval' || lower === 'zone5' || lower === 'zone 5') {
    return 'vo2';
  }
  if (lower === 'endurance' || lower === 'long' || lower === 'long run' || lower === 'long ride') {
    return 'endurance';
  }

  // Partial matches
  if (lower.includes('recovery') || lower.includes('easy') || lower.includes('rest')) {
    return 'recovery';
  }
  if (lower.includes('threshold') || lower.includes('tempo')) {
    return 'threshold';
  }
  if (lower.includes('vo2') || lower.includes('interval') || lower.includes('sprint')) {
    return 'vo2';
  }
  if (lower.includes('endurance') || lower.includes('long')) {
    return 'endurance';
  }
  if (lower.includes('aerobic') || lower.includes('base') || lower.includes('zone 2')) {
    return 'aerobic';
  }

  // Default fallback
  return 'aerobic';
}

/**
 * Maps a CalendarSession to a PlannedWorkout, including intensity mapping.
 */
export function mapSessionToWorkout(session: CalendarSession): import('@/types').PlannedWorkout | null {
  if (session.status === 'completed') return null;

  return {
    id: session.id,
    date: session.date,
    sport: session.type as import('@/types').Sport,
    intent: mapIntensityToIntent(session.intensity),
    title: session.title,
    description: session.notes || '',
    duration: session.duration_minutes || 0,
    distance: session.distance_km || undefined,
    completed: false,
  };
}

/**
 * Matches a completed activity to a planned session based on date, sport, and similarity.
 * Returns the session ID if a match is found, null otherwise.
 */
export function matchActivityToSession(
  activity: import('@/types').CompletedActivity,
  sessions: CalendarSession[],
  dateTolerance: number = 0 // Days tolerance (0 = same day only)
): string | null {
  // Ensure sessions is an array
  if (!Array.isArray(sessions)) {
    return null;
  }

  const activityDate = new Date(activity.date);
  const activitySport = activity.sport.toLowerCase();

  // Find sessions on the same date (or within tolerance)
  const candidateSessions = sessions.filter(session => {
    if (session.status !== 'planned') return false;
    
    const sessionDate = new Date(session.date);
    const daysDiff = Math.abs((activityDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > dateTolerance) return false;
    
    const sessionSport = session.type.toLowerCase();
    
    // Exact sport match
    if (sessionSport === activitySport) return true;
    
    // Handle variations (e.g., "run" vs "running")
    if (sessionSport.includes(activitySport) || activitySport.includes(sessionSport)) return true;
    
    return false;
  });

  if (candidateSessions.length === 0) return null;

  // If multiple candidates, prefer exact date match
  const exactMatch = candidateSessions.find(s => {
    const sessionDate = new Date(s.date);
    return sessionDate.toDateString() === activityDate.toDateString();
  });

  if (exactMatch) return exactMatch.id;

  // Return the first candidate (closest date)
  return candidateSessions[0].id;
}

