import type { CalendarItem } from '@/types/calendar';

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
 * Maps calendar intent to human-readable workout type
 */
function getWorkoutTypeLabel(intent: string): string {
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

export function toCalendarCardProps(item: CalendarItem): CalendarCardProps {
  const variant = deriveCardVariant(item);

  // Format duration
  const duration = formatDuration(item.durationMin);

  // Get human-readable workout type
  const workoutType = getWorkoutTypeLabel(item.intent);

  // Extract pace from secondary metric (for completed activities)
  const pace =
    item.kind === 'completed' && item.secondary?.match(/\d+:\d+/)
      ? item.secondary.match(/\d+:\d+/)?.[0]
      : undefined;

  // Sparkline only for completed activities
  const sparkline =
    item.kind === 'completed' && item.compliance === 'complete'
      ? generateMockSparkline()
      : undefined;

  // Description: prioritize coachNote, then description, then empty
  const description = item.coachNote?.text || item.description || undefined;

  return {
    variant,
    duration,
    workoutType,
    title: item.title || workoutType,
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
