import { WorkoutCardSvg, type WorkoutCardVariant } from '@/components/workout/WorkoutCardSvg';
import { BaseCalendarCardSvg } from './BaseCalendarCardSvg';
import { toCalendarCardProps, deriveCardVariant, toSessionCardProps } from './calendarCardAdapter';
import type { CalendarItem } from '@/types/calendar';
import type { ActivityStreamsResponse } from '@/lib/api';

interface CalendarWorkoutCardSvgProps {
  item: CalendarItem;
  viewVariant: 'month' | 'week' | 'plan';
  streams?: ActivityStreamsResponse | null;
  className?: string;
  /** Mobile breakpoint flag - when true, uses stacked layout */
  isMobile?: boolean;
}

const mapVariant = (variant: 'month' | 'week' | 'plan'): WorkoutCardVariant =>
  variant === 'month' ? 'mobile' : 'feed';

export function CalendarWorkoutCardSvg({ item, viewVariant, streams, className, isMobile }: CalendarWorkoutCardSvgProps) {
  const props = toCalendarCardProps(item);
  const isCompleted = item.kind === 'completed';

  // Planned sessions: use BaseCalendarCardSvg (training calendar card)
  if (!isCompleted) {
    const cardVariant = deriveCardVariant(item);
    const sessionCardProps = toSessionCardProps(item);
    return (
      <BaseCalendarCardSvg
        variant={cardVariant}
        topLeft={props.workoutType}
        topRight={props.duration}
        title={props.title || props.workoutType}
        description={props.description ?? null}
        isPlanned={true}
        isActivity={false}
        viewVariant={viewVariant}
        isMobile={isMobile}
        intentText={sessionCardProps.intentText}
        coachInsight={sessionCardProps.coachInsight}
        planContext={sessionCardProps.planContext}
      />
    );
  }

  // Completed activities: use WorkoutCardSvg with map/route
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
