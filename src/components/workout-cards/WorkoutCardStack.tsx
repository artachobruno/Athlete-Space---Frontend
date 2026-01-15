/**
 * WorkoutCardStack
 * 
 * Renders multiple workout cards in a stacked "deck of cards" effect.
 * Max 3 visible cards with offset and scale transforms.
 */

import { WorkoutCard } from './WorkoutCard';
import type { CalendarItem } from '@/types/calendar';

interface WorkoutCardStackProps {
  items: CalendarItem[];
  onClick?: (item: CalendarItem) => void;
  maxVisible?: number;
}

export function WorkoutCardStack({
  items,
  onClick,
  maxVisible = 3,
}: WorkoutCardStackProps) {
  const visibleItems = items.slice(0, maxVisible);
  const cardHeight = 130;

  if (visibleItems.length === 0) {
    return null;
  }

  if (visibleItems.length === 1) {
    return (
      <div className="relative w-full h-[130px]">
        <WorkoutCard
          item={visibleItems[0]}
          onClick={onClick ? () => onClick(visibleItems[0]) : undefined}
          height={cardHeight}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[130px]">
      {visibleItems.map((item, idx) => {
        const offsetX = idx * 6;
        const offsetY = -idx * 6;
        const scale = 1 - idx * 0.02;
        const zIndex = 10 - idx;

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
            <WorkoutCard
              item={item}
              onClick={onClick ? () => onClick(item) : undefined}
              height={cardHeight}
            />
          </div>
        );
      })}
    </div>
  );
}
