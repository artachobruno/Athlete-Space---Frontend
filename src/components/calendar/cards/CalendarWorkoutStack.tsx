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
  
  // Card dimensions based on variant
  const cardHeight = variant === 'week' ? 180 : variant === 'plan' ? 150 : 130;
  const cardWidth = variant === 'week' ? 300 : 200;

  if (visibleItems.length === 0) {
    return null;
  }

  // Single card - no stacking needed
  if (visibleItems.length === 1) {
    const cardProps = toCalendarCardProps(visibleItems[0]);
    const cardContent = (
      <CalendarWorkoutCard
        {...cardProps}
        width={cardWidth}
        height={cardHeight}
      />
    );

    if (onClick) {
      return (
        <div className="relative w-full" style={{ height: `${cardHeight}px` }}>
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
      <div className="relative w-full" style={{ height: `${cardHeight}px` }}>
        {cardContent}
      </div>
    );
  }

  // Multiple cards - stack with offsets
  return (
    <div className="relative w-full" style={{ height: `${cardHeight}px` }}>
      {visibleItems.map((item, idx) => {
        const cardProps = toCalendarCardProps(item);
        const offsetX = idx * 6;
        const offsetY = idx * 6;
        const scale = 1 - idx * 0.03; // 0.97, 0.94, 0.91
        const zIndex = 10 - idx;

        const cardContent = (
          <CalendarWorkoutCard
            {...cardProps}
            width={cardWidth}
            height={cardHeight}
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
              transformOrigin: 'top left',
            }}
          >
            {cardElement}
          </div>
        );
      })}
    </div>
  );
}
