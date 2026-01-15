/**
 * CalendarWorkoutStack
 * 
 * Renders multiple workout cards in a stacked "deck of cards" effect.
 * Handles multiple sessions per day with absolute positioning + scale offsets.
 */

import { CalendarWorkoutCard } from './CalendarWorkoutCard';
import { toCalendarCardProps } from './calendarCardAdapter';
import type { CalendarItem } from '@/types/calendar';

interface CalendarWorkoutStackProps {
  items: CalendarItem[];
  variant?: 'month' | 'week' | 'plan';
  maxVisible?: number;
  onClick?: (item: CalendarItem) => void;
}

export function CalendarWorkoutStack({
  items,
  variant = 'month',
  maxVisible = 3,
  onClick,
}: CalendarWorkoutStackProps) {
  const visibleItems = items.slice(0, maxVisible);

  if (visibleItems.length === 0) {
    return null;
  }

  // Single card - no stacking needed
  if (visibleItems.length === 1) {
    const cardProps = toCalendarCardProps(visibleItems[0]);
    const cardContent = (
      <CalendarWorkoutCard
        {...cardProps}
      />
    );

    if (onClick) {
      return (
        <div className="relative w-full h-full">
          <button
            onClick={() => onClick(visibleItems[0])}
            className="w-full h-full rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/20 transition-transform hover:scale-[1.02]"
            type="button"
          >
            {cardContent}
          </button>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full">
        {cardContent}
      </div>
    );
  }

  // Multiple cards - stack with offsets
  const CARD_OFFSET = 6;
  const SCALE_STEP = 0.04;
  
  return (
    <div className="relative w-full h-full">
      {visibleItems.map((item, idx) => {
        const cardProps = toCalendarCardProps(item);
        const offsetX = idx * CARD_OFFSET;
        const offsetY = idx * CARD_OFFSET;
        const scale = 1 - idx * SCALE_STEP;
        const zIndex = 10 - idx;

        const cardContent = (
          <CalendarWorkoutCard
            {...cardProps}
          />
        );

        const cardElement = onClick ? (
          <button
            onClick={() => onClick(item)}
            className="w-full h-full rounded-2xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/20 transition-transform hover:scale-[1.02]"
            type="button"
            style={{ pointerEvents: idx === 0 ? 'auto' : 'none' }}
          >
            {cardContent}
          </button>
        ) : (
          cardContent
        );

        return (
          <div
            key={item.id}
            className="absolute inset-0"
            style={{
              transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
              zIndex,
              transformOrigin: 'top right',
            }}
          >
            {cardElement}
          </div>
        );
      })}
    </div>
  );
}
