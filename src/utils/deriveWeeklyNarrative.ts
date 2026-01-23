/**
 * Derives weekly narrative from sessions
 * 
 * Purely derived from existing session data - no AI, no new metrics.
 * Answers: "What is this week about, and what matters most?"
 */

import type { CalendarSession } from '@/lib/api';
import { normalizeCalendarIntent } from '@/types/calendar';

export interface WeeklyNarrative {
  summary: string;
  focusSessionId?: string;
  keySessionTitle?: string;
}

/**
 * Derives weekly narrative from sessions
 * 
 * Rules (in order):
 * 1. Identify key session (first long, else first tempo/intervals, else none)
 * 2. Identify dominant theme (≥50% easy → "aerobic durability", quality present → "controlled intensity", race present → "race readiness")
 * 3. Generate narrative text using templates
 */
export function deriveWeeklyNarrative(
  sessions: CalendarSession[]
): WeeklyNarrative {
  if (!sessions || sessions.length === 0) {
    return {
      summary: 'Recovery week. Focus on adaptation and light movement.',
    };
  }

  // Filter to planned sessions only (for narrative purposes)
  const plannedSessions = sessions.filter(s => s.status === 'planned' || s.status === 'completed');

  if (plannedSessions.length === 0) {
    return {
      summary: 'Recovery week. Focus on adaptation and light movement.',
    };
  }

  // Step 1: Identify key session
  const keySession = findKeySession(plannedSessions);

  // Step 2: Identify dominant theme
  const theme = identifyTheme(plannedSessions);

  // Step 3: Generate narrative
  const summary = generateNarrative(theme, keySession);

  return {
    summary,
    focusSessionId: keySession?.id,
    keySessionTitle: keySession?.title,
  };
}

/**
 * Finds the key session for the week
 * Priority: long > tempo/intervals > none
 */
function findKeySession(sessions: CalendarSession[]): CalendarSession | undefined {
  // First, look for long run
  const longSession = sessions.find(s => {
    const intent = normalizeCalendarIntent(s.intensity);
    return intent === 'long';
  });

  if (longSession) {
    return longSession;
  }

  // Then look for tempo or intervals
  const qualitySession = sessions.find(s => {
    const intent = normalizeCalendarIntent(s.intensity);
    return intent === 'tempo' || intent === 'intervals';
  });

  return qualitySession;
}

/**
 * Identifies the dominant theme of the week
 */
function identifyTheme(sessions: CalendarSession[]): 'aerobic_durability' | 'controlled_intensity' | 'race_readiness' {
  // Check for race sessions
  const hasRace = sessions.some(s => {
    const titleLower = (s.title || '').toLowerCase();
    const typeLower = (s.type || '').toLowerCase();
    return titleLower.includes('race') || typeLower.includes('race');
  });

  if (hasRace) {
    return 'race_readiness';
  }

  // Check for quality sessions (tempo, intervals)
  const hasQuality = sessions.some(s => {
    const intent = normalizeCalendarIntent(s.intensity);
    return intent === 'tempo' || intent === 'intervals';
  });

  if (hasQuality) {
    return 'controlled_intensity';
  }

  // Count easy sessions
  const easyCount = sessions.filter(s => {
    const intent = normalizeCalendarIntent(s.intensity);
    return intent === 'easy' || intent === 'rest';
  }).length;

  const easyPercentage = easyCount / sessions.length;

  if (easyPercentage >= 0.5) {
    return 'aerobic_durability';
  }

  // Default to controlled intensity if mixed
  return 'controlled_intensity';
}

/**
 * Generates narrative text based on theme and key session
 * Max 140 characters
 */
function generateNarrative(
  theme: 'aerobic_durability' | 'controlled_intensity' | 'race_readiness',
  keySession?: CalendarSession
): string {
  const templates = {
    aerobic_durability: {
      base: 'This week focuses on aerobic durability. Keep effort relaxed and consistent.',
      withKey: (sessionTitle: string) => {
        // Use a shorter reference if title is long
        const shortTitle = sessionTitle.length > 25 
          ? sessionTitle.split(' ').slice(0, 3).join(' ') + '...'
          : sessionTitle;
        return `This week focuses on aerobic durability. ${shortTitle} is the key session.`;
      },
    },
    controlled_intensity: {
      base: 'This week introduces controlled intensity. Prioritize execution on key workouts.',
      withKey: (sessionTitle: string) => {
        const shortTitle = sessionTitle.length > 20
          ? sessionTitle.split(' ').slice(0, 2).join(' ') + '...'
          : sessionTitle;
        return `This week introduces controlled intensity. Prioritize ${shortTitle}.`;
      },
    },
    race_readiness: {
      base: 'This week focuses on race readiness. Maintain sharpness while staying fresh.',
      withKey: (sessionTitle: string) => {
        const shortTitle = sessionTitle.length > 20
          ? sessionTitle.split(' ').slice(0, 2).join(' ') + '...'
          : sessionTitle;
        return `This week focuses on race readiness. ${shortTitle} is the priority.`;
      },
    },
  };

  const themeTemplates = templates[theme];

  if (keySession && keySession.title) {
    const narrative = themeTemplates.withKey(keySession.title);
    
    // Ensure max 140 characters
    return narrative.length > 140 ? narrative.slice(0, 137) + '...' : narrative;
  }

  const narrative = themeTemplates.base;
  return narrative.length > 140 ? narrative.slice(0, 137) + '...' : narrative;
}
