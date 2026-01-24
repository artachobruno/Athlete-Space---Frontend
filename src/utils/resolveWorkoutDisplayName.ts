/**
 * Resolves canonical coach vocabulary for workout display names.
 * 
 * This is the shared language layer that provides deterministic workout
 * names based on sport, intent, and vocabulary level. Used by:
 * 
 * - UI card titles (via calendarAdapter)
 * - Weekly narrative text (future)
 * - Modal narrative blocks (future)
 * - LLM coach responses (as a consumer, not generator)
 * 
 * The LLM coach should reference these names but never invent new ones.
 * This ensures consistent coach voice across all touchpoints.
 * 
 * @param sport - Calendar sport type
 * @param intent - Calendar intent type
 * @param vocabularyLevel - Coach vocabulary level (defaults to 'intermediate')
 * @returns Canonical workout display name
 */
import type { CoachVocabularyLevel } from '@/types/vocabulary';
import type { CalendarSport, CalendarIntent } from '@/types/calendar';
import { workoutDisplayNames } from '@/copy/workoutDisplayNames';

export function resolveWorkoutDisplayName({
  sport,
  intent,
  vocabularyLevel,
}: {
  sport: CalendarSport;
  intent: CalendarIntent;
  vocabularyLevel?: CoachVocabularyLevel | null;
}): string {
  const level: CoachVocabularyLevel = vocabularyLevel ?? 'intermediate';
  
  const sportNames = workoutDisplayNames[sport];
  if (!sportNames) {
    return intent;
  }
  
  const intentNames = sportNames[intent];
  if (!intentNames) {
    return intent;
  }
  
  const displayName = intentNames[level];
  if (displayName) {
    return displayName;
  }
  
  const fallbackName = intentNames.intermediate;
  if (fallbackName) {
    return fallbackName;
  }
  
  return intent;
}
