import type { CalendarItem } from '@/types/calendar';

export interface CalendarCardProps {
  variant: string;
  duration: string;
  workoutType: string;
  title: string;
  distance?: string;
  pace?: string;
  sparkline?: number[];
  coachNote?: {
    text: string;
    tone: 'warning' | 'encouragement' | 'neutral';
  };
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

  const intentLabels: Record<string, string> = {
    aerobic: 'Aerobic',
    threshold: 'Threshold',
    vo2: 'VO₂',
    endurance: 'Endurance',
    recovery: 'Recovery',
  };

  const duration = `${item.durationMin}m`;

  const pace =
    item.kind === 'completed' && item.secondary?.match(/\d+:\d+/)
      ? item.secondary.match(/\d+:\d+/)?.[0]
      : undefined;

  const sparkline =
    item.kind === 'completed' && item.compliance === 'complete'
      ? generateMockSparkline()
      : undefined;

  return {
    variant,
    duration,
    workoutType: intentLabels[item.intent] || item.intent,
    title: item.title || intentLabels[item.intent] || '',
    pace,
    sparkline,
    coachNote: item.coachNote,
  };
}

function generateMockSparkline(): number[] {
  return Array.from({ length: 20 }, (_, i) =>
    Math.max(0, Math.min(1, 0.5 + Math.sin(i / 2) * 0.3))
  );
}
