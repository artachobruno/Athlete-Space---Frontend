import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarItem } from '@/types/calendar';
import { normalizeCalendarSport, normalizeCalendarIntent } from '@/types/calendar';

export function toPlanCalendarItem(
  date: Date,
  workout?: PlannedWorkout,
  completed?: CompletedActivity
): CalendarItem | null {
  if (!workout && !completed) return null;

  const title = workout?.title || completed?.title || '';
  return {
    id: workout?.id || completed?.id || '',
    kind: completed ? 'completed' : 'planned',
    sport: normalizeCalendarSport(workout?.sport || completed?.sport, title),
    intent: normalizeCalendarIntent(workout?.intent || 'aerobic'),
    title,
    startLocal: date.toISOString(),
    durationMin: workout?.duration || completed?.duration || 0,
    load: completed?.trainingLoad,
    secondary: completed?.avgPace,
    isPaired: Boolean(completed),
    compliance: completed ? 'complete' : undefined,
    coachNote: workout
      ? {
          text: coachNotes[workout.intent] || 'Execute as planned.',
          tone: 'neutral',
        }
      : undefined,
  };
}

const coachNotes: Record<string, string> = {
  aerobic: 'Keep this fully aerobic. Stay conversational.',
  threshold: 'Strong but controlled. Do not overreach.',
  vo2: 'Hard session. Arrive rested and focused.',
  endurance: 'Fuel well. Pace conservatively.',
  recovery: 'Very easy. Prioritize recovery.',
};
