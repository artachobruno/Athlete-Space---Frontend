import { BaseCalendarCardSvg } from './BaseCalendarCardSvg';
import { toUnifiedCalendarCardProps } from './calendarCardAdapter';
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

/**
 * Single unified calendar card for both planned and completed.
 * Uses BaseCalendarCardSvg only – no separate session vs activity card.
 * Plan (intent) and execution (summary, coach) are combined in one card.
 */
export function CalendarWorkoutCardSvg({
  item,
  viewVariant,
  streams: _streams,
  className: _className,
  isMobile,
}: CalendarWorkoutCardSvgProps) {
  const props = toUnifiedCalendarCardProps(item);
  return (
    <BaseCalendarCardSvg
      {...props}
      viewVariant={viewVariant}
      isMobile={isMobile}
    />
  );
}
