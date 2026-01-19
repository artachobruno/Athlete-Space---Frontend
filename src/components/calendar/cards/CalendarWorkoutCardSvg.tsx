import { WorkoutCardSvg, type WorkoutCardVariant } from '@/components/workout/WorkoutCardSvg';
import { toCalendarCardProps } from './calendarCardAdapter';
import type { CalendarItem } from '@/types/calendar';
import type { ActivityStreamsResponse } from '@/lib/api';

interface CalendarWorkoutCardSvgProps {
  item: CalendarItem;
  viewVariant: 'month' | 'week' | 'plan';
  streams?: ActivityStreamsResponse | null;
  className?: string;
}

const mapVariant = (variant: 'month' | 'week' | 'plan'): WorkoutCardVariant =>
  variant === 'month' ? 'mobile' : 'feed';

export function CalendarWorkoutCardSvg({ item, viewVariant, streams, className }: CalendarWorkoutCardSvgProps) {
  const props = toCalendarCardProps(item);
  const variant = mapVariant(viewVariant);
  const tss = item.load !== undefined ? Math.round(item.load) : null;
  const fontScale = viewVariant === 'month' ? 1.2 : viewVariant === 'week' ? 1.15 : 1;

  return (
    <WorkoutCardSvg
      title={props.title || props.workoutType}
      distance={props.distance ?? null}
      time={props.duration}
      pace={props.pace ?? null}
      typeLabel={props.workoutType}
      tss={tss}
      routePoints={streams?.route_points as [number, number][] | null ?? null}
      paceStream={streams?.pace ?? null}
      elevationStream={streams?.elevation ?? null}
      variant={variant}
      fontScale={fontScale}
      className={className}
    />
  );
}
