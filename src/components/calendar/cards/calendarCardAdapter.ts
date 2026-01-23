import type { CalendarItem } from '@/types/calendar';
import type { BaseCardProps } from './BaseCalendarCardSvg';

export interface CalendarCardProps {
  variant: string;
  duration: string;
  workoutType: string;
  title: string;
  distance?: string;
  pace?: string;
  description?: string;
  sparkline?: number[];
}

export type CalendarCardRenderModel =
  | { cardType: 'session'; props: BaseCardProps }
  | { cardType: 'activity'; props: BaseCardProps }
  | { cardType: 'plan_day'; props: BaseCardProps };

/**
 * Formats duration in minutes to human-readable string
 * Examples: 60m, 1h 20m, 2h 15m
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Derives narrative intent text (WHY) from CalendarItem
 * Present tense for planned, past tense for completed
 * Max 120 characters
 */
function deriveIntentText(item: CalendarItem): string | undefined {
  const intentNarratives: Record<string, string> = {
    easy: 'Maintain aerobic base and promote recovery.',
    steady: 'Build endurance at sustainable effort.',
    tempo: 'Develop threshold fitness and race pace feel.',
    intervals: 'Improve VO2 max and speed endurance.',
    long: 'Build fatigue resistance late-race.',
    rest: 'Recovery and adaptation day.',
  };

  // Base narrative from intent
  let narrative = intentNarratives[item.intent] || 'Training session.';

  // Enhance with title/description context if available
  const titleLower = item.title?.toLowerCase() || '';
  const descLower = item.description?.toLowerCase() || '';

  // Special handling for race
  if (item.sport === 'race') {
    narrative = 'Race day — execute your plan.';
  }

  // Adjust tense based on kind
  if (item.kind === 'completed') {
    // Convert to past tense
    narrative = narrative
      .replace(/Build/g, 'Built')
      .replace(/Maintain/g, 'Maintained')
      .replace(/Develop/g, 'Developed')
      .replace(/Improve/g, 'Improved')
      .replace(/Promote/g, 'Promoted')
      .replace(/Execute/g, 'Executed');
  }

  // Truncate to 120 chars
  if (narrative.length > 120) {
    narrative = narrative.slice(0, 117) + '...';
  }

  return narrative;
}

/**
 * Derives execution summary (DID IT WORK?) from CalendarItem
 * Only for completed activities
 * Max 120 characters, factual and neutral
 */
function deriveExecutionSummary(item: CalendarItem): string | undefined {
  if (item.kind !== 'completed') {
    return undefined;
  }

  const compliance = item.compliance;
  const isPaired = item.isPaired;
  const executionNotes = item.executionNotes;

  // If we have explicit execution notes, use them (truncated)
  if (executionNotes && executionNotes.trim()) {
    const trimmed = executionNotes.trim();
    return trimmed.length > 120 ? trimmed.slice(0, 117) + '...' : trimmed;
  }

  // Derive from compliance + pairing
  if (compliance === 'complete') {
    if (isPaired) {
      return 'On target — matched plan.';
    }
    return 'Completed as planned.';
  }

  if (compliance === 'partial') {
    return 'Completed with reduced volume.';
  }

  if (compliance === 'missed') {
    return 'Missed due to schedule or fatigue.';
  }

  // Fallback for completed without compliance
  return 'Completed.';
}

/**
 * Derives plan context (WHERE IN THE ARC) from CalendarItem
 * Placeholder implementation - can be enhanced with actual plan data
 */
function derivePlanContext(item: CalendarItem): string | undefined {
  // TODO: Integrate with actual plan data when available
  // For now, return undefined to avoid showing placeholder text
  // This can be populated from plan metadata when that feature is added
  return undefined;
}

/**
 * Maps calendar intent to human-readable workout type
 */
function getWorkoutTypeLabel(intent: string, sport?: string): string {
  // Special handling for race entries
  if (sport === 'race') {
    return 'Race';
  }

  const labels: Record<string, string> = {
    easy: 'Easy',
    steady: 'Steady',
    tempo: 'Tempo',
    intervals: 'Intervals',
    long: 'Long',
    rest: 'Rest',
    // Legacy mappings
    aerobic: 'Easy',
    threshold: 'Tempo',
    vo2: 'Intervals',
    endurance: 'Long',
    recovery: 'Easy',
  };
  return labels[intent] || intent;
}

export function deriveCardVariant(item: CalendarItem): string {
  const isCompleted = item.kind === 'completed';

  // Race entries get special styling
  if (item.sport === 'race') {
    return isCompleted ? 'completed-running' : 'planned-running';
  }

  if (item.sport === 'strength') return 'strength';

  if (item.sport === 'run' || item.sport === 'other') {
    return isCompleted ? 'completed-running' : 'planned-running';
  }
  if (item.sport === 'ride') {
    return isCompleted ? 'completed-cycling' : 'planned-cycling';
  }
  if (item.sport === 'swim') {
    return isCompleted ? 'completed-swimming' : 'planned-swimming';
  }

  return isCompleted ? 'completed-running' : 'planned-running';
}

/**
 * Formats distance in km to a human-readable string
 * Examples: 5.0 km, 10.5 km, 21.1 km
 */
function formatDistance(distanceKm: number | undefined): string | undefined {
  if (distanceKm === undefined || distanceKm === null || distanceKm <= 0) {
    return undefined;
  }
  // Round to 1 decimal place
  const rounded = Math.round(distanceKm * 10) / 10;
  return `${rounded} km`;
}

export function toCalendarCardProps(item: CalendarItem): CalendarCardProps {
  const variant = deriveCardVariant(item);

  // Format duration
  const duration = formatDuration(item.durationMin);

  // Get human-readable workout type
  const workoutType = getWorkoutTypeLabel(item.intent, item.sport);

  // Format distance
  const distance = formatDistance(item.distanceKm);

  // Use pace from CalendarItem (extracted from activity)
  const pace = item.pace;

  // Sparkline only for completed activities
  const sparkline =
    item.kind === 'completed' && item.compliance === 'complete'
      ? generateMockSparkline()
      : undefined;

  // Description: long-form fallback only (deprecated for primary narrative)
  // Do not use for intent or execution - use semantic fields instead
  const description = item.description || undefined;

  return {
    variant,
    duration,
    workoutType,
    title: item.title || workoutType,
    distance,
    pace,
    description,
    sparkline,
  };
}

function generateMockSparkline(): number[] {
  return Array.from({ length: 20 }, (_, i) =>
    Math.max(0, Math.min(1, 0.5 + Math.sin(i / 2) * 0.3))
  );
}

function toSessionCardProps(item: CalendarItem): BaseCardProps {
  const variant = deriveCardVariant(item);
  const p = toCalendarCardProps(item);
  const secondaryText =
    p.distance || p.pace ? [p.distance, p.pace].filter(Boolean).join(' · ') : undefined;

  return {
    variant,
    topLeft: p.duration,
    topRight: p.workoutType,
    metricsLabel: secondaryText ? 'DISTANCE · AVG PACE' : undefined,
    metricsValue: secondaryText,
    title: p.title,
    description: p.description, // Long-form fallback only
    sparkline: p.sparkline,
    isPlanned: true,
    isActivity: false,
    // Semantic elevation fields
    planContext: derivePlanContext(item),
    intentText: deriveIntentText(item),
    coachInsight: item.coachNote ?? undefined,
  };
}

function toActivityCardProps(item: CalendarItem): BaseCardProps {
  const variant = deriveCardVariant(item);
  const p = toCalendarCardProps(item);
  const secondaryText =
    p.distance || p.pace ? [p.distance, p.pace].filter(Boolean).join(' · ') : undefined;

  return {
    variant,
    topLeft: p.duration,
    topRight: p.workoutType,
    metricsLabel: secondaryText ? 'DISTANCE · AVG PACE' : undefined,
    metricsValue: secondaryText,
    title: p.title,
    description: p.description, // Long-form fallback only
    sparkline: p.sparkline,
    isActivity: true,
    isPlanned: false,
    // Semantic elevation fields
    planContext: derivePlanContext(item),
    intentText: deriveIntentText(item),
    executionSummary: deriveExecutionSummary(item),
    coachInsight: item.coachNote ?? undefined,
  };
}

function toTrainingDayCardProps(item: CalendarItem): BaseCardProps {
  const variant = deriveCardVariant(item);
  const p = toCalendarCardProps(item);

  return {
    variant,
    topLeft: p.duration,
    topRight: p.workoutType,
    metricsLabel: undefined,
    metricsValue: undefined,
    title: p.title,
    description: p.description, // Long-form fallback only
    sparkline: null,
    titleClampLines: 2,
    descClampLines: 4,
    // Semantic elevation fields
    planContext: derivePlanContext(item),
    intentText: deriveIntentText(item),
    coachInsight: item.coachNote ?? undefined,
  };
}

export function toCalendarCardRenderModel(item: CalendarItem): CalendarCardRenderModel {
  if (item.kind === 'completed') {
    return {
      cardType: 'activity',
      props: toActivityCardProps(item),
    };
  }

  // For now, treat all planned items as sessions
  // TODO: Add plan_day detection when that feature is added
  return {
    cardType: 'session',
    props: toSessionCardProps(item),
  };
}
