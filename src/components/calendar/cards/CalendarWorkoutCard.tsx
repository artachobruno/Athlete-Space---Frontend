/**
 * CalendarWorkoutCard
 *
 * Session card wrapper for calendar workout cards.
 * Uses BaseCalendarCardSvg for the shared SVG frame.
 */

import { BaseCalendarCardSvg, type BaseCardProps } from './BaseCalendarCardSvg';

export function CalendarWorkoutCard(props: BaseCardProps) {
  return <BaseCalendarCardSvg {...props} />;
}
