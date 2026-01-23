/**
 * Canonical Copy Templates for Workout Narratives
 * 
 * Single source of truth for all workout narrative copy.
 * Prevents copy drift as logic grows.
 * 
 * Max length: 120 characters per template
 */

import type { CalendarSport, CalendarIntent, CalendarCompliance } from '@/types/calendar';

/**
 * Intent narrative templates (WHY)
 * Present tense for planned sessions, past tense for completed
 */
export const intentNarratives: Record<CalendarIntent, string> = {
  easy: 'Maintain aerobic base and promote recovery.',
  steady: 'Build endurance at sustainable effort.',
  tempo: 'Develop threshold fitness and race pace feel.',
  intervals: 'Improve VO2 max and speed endurance.',
  long: 'Build fatigue resistance late-race.',
  rest: 'Recovery and adaptation day.',
};

/**
 * Sport-specific intent overrides
 * When a specific sport + intent combination needs different copy
 */
export const sportIntentOverrides: Partial<Record<CalendarSport, Partial<Record<CalendarIntent, string>>>> = {
  race: {
    easy: 'Race day — execute your plan.',
    steady: 'Race day — execute your plan.',
    tempo: 'Race day — execute your plan.',
    intervals: 'Race day — execute your plan.',
    long: 'Race day — execute your plan.',
    rest: 'Race day — execute your plan.',
  },
  swim: {
    easy: 'Maintain aerobic base and promote recovery.',
    steady: 'Build endurance at sustainable effort.',
    tempo: 'Develop threshold fitness and race pace feel.',
    intervals: 'Improve VO2 max and speed endurance.',
    long: 'Build fatigue resistance late-race.',
  },
  strength: {
    easy: 'Maintain strength base and promote recovery.',
    steady: 'Build muscular endurance at sustainable effort.',
    tempo: 'Develop power and strength endurance.',
    intervals: 'Improve explosive power and speed.',
    long: 'Build muscular fatigue resistance.',
  },
};

/**
 * Execution summary templates (DID IT WORK?)
 * Only for completed activities
 * Factual and neutral tone
 */
export const executionSummaries: Record<CalendarCompliance, string> = {
  complete: 'On target — matched plan.',
  partial: 'Completed with reduced volume.',
  missed: 'Missed due to schedule or fatigue.',
};

/**
 * Execution summary variants
 * Context-specific alternatives
 */
export const executionSummaryVariants = {
  complete: {
    paired: 'On target — matched plan.',
    unpaired: 'Completed as planned.',
  },
  partial: {
    default: 'Completed with reduced volume.',
    time: 'Completed with reduced duration.',
    distance: 'Completed with reduced distance.',
  },
  missed: {
    default: 'Missed due to schedule or fatigue.',
    schedule: 'Missed due to schedule conflict.',
    fatigue: 'Missed due to fatigue or recovery needs.',
  },
};

/**
 * Coach sentence patterns
 * Organized by tone for consistent messaging
 */
export const coachPatterns = {
  neutral: [
    'Session completed within target parameters.',
    'Execution matched planned structure.',
    'Workout aligned with training objectives.',
    'Performance consistent with plan.',
  ],
  encouragement: [
    'Strong execution — you hit your targets.',
    'Well done — maintained focus throughout.',
    'Excellent work — stayed within target zones.',
    'Great session — effort matched intent.',
    'Solid performance — on track with plan.',
  ],
  warning: [
    'Monitor recovery — session was intense.',
    'Consider rest — fatigue may be elevated.',
    'Watch for overreaching — load was high.',
    'Recovery needed — session exceeded targets.',
    'Take it easy — body needs adaptation time.',
  ],
};

/**
 * Tense conversion helpers
 * Converts present tense (planned) to past tense (completed)
 */
const tenseConversions: Record<string, string> = {
  'Build': 'Built',
  'Maintain': 'Maintained',
  'Develop': 'Developed',
  'Improve': 'Improved',
  'Promote': 'Promoted',
  'Execute': 'Executed',
};

/**
 * Gets intent narrative for a given sport and intent
 * Returns present tense (for planned) or past tense (for completed)
 */
export function getIntentNarrative(
  sport: CalendarSport,
  intent: CalendarIntent,
  isCompleted: boolean = false
): string {
  // Check for sport-specific override first
  const sportOverride = sportIntentOverrides[sport]?.[intent];
  if (sportOverride) {
    return convertTense(sportOverride, isCompleted);
  }

  // Use base intent narrative
  const narrative = intentNarratives[intent];
  return convertTense(narrative, isCompleted);
}

/**
 * Converts narrative to past tense if completed
 */
function convertTense(text: string, isCompleted: boolean): string {
  if (!isCompleted) {
    return text;
  }

  let converted = text;
  for (const [present, past] of Object.entries(tenseConversions)) {
    converted = converted.replace(new RegExp(present, 'g'), past);
  }
  return converted;
}

/**
 * Gets execution summary for a given compliance status
 * Supports context-specific variants
 */
export function getExecutionSummary(
  compliance: CalendarCompliance,
  context?: {
    isPaired?: boolean;
    reductionType?: 'time' | 'distance' | 'default';
    missReason?: 'schedule' | 'fatigue' | 'default';
  }
): string {
  if (compliance === 'complete') {
    if (context?.isPaired === false) {
      return executionSummaryVariants.complete.unpaired;
    }
    return executionSummaryVariants.complete.paired;
  }

  if (compliance === 'partial') {
    if (context?.reductionType === 'time') {
      return executionSummaryVariants.partial.time;
    }
    if (context?.reductionType === 'distance') {
      return executionSummaryVariants.partial.distance;
    }
    return executionSummaryVariants.partial.default;
  }

  if (compliance === 'missed') {
    if (context?.missReason === 'schedule') {
      return executionSummaryVariants.missed.schedule;
    }
    if (context?.missReason === 'fatigue') {
      return executionSummaryVariants.missed.fatigue;
    }
    return executionSummaryVariants.missed.default;
  }

  return executionSummaries[compliance];
}

/**
 * Truncates text to max 120 characters
 * Adds ellipsis if truncated
 */
export function truncateNarrative(text: string, maxLength: number = 120): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}
