import { WorkoutCardSvg, type WorkoutCardVariant } from '@/components/workout/WorkoutCardSvg';
import { toCalendarCardProps } from './calendarCardAdapter';
import type { CalendarItem } from '@/types/calendar';

interface CalendarWorkoutCardSvgProps {
  item: CalendarItem;
  viewVariant: 'month' | 'week' | 'plan';
  className?: string;
}

const mapVariant = (variant: 'month' | 'week' | 'plan'): WorkoutCardVariant =>
  variant === 'month' ? 'mobile' : 'feed';

export function CalendarWorkoutCardSvg({ item, viewVariant, className }: CalendarWorkoutCardSvgProps) {
  const props = toCalendarCardProps(item);
  const variant = mapVariant(viewVariant);
  const tss = item.load !== undefined ? Math.round(item.load) : null;

  return (
    <WorkoutCardSvg
      title={props.title || props.workoutType}
      distance={props.distance ?? null}
      time={props.duration}
      pace={props.pace ?? null}
      typeLabel={props.workoutType}
      tss={tss}
      variant={variant}
      className={className}
    />
  );
}
