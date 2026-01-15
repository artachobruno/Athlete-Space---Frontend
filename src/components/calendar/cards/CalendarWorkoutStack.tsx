import { CalendarWorkoutCard } from './CalendarWorkoutCard';
import { toCalendarCardProps } from './calendarCardAdapter';
import type { CalendarItem } from '@/types/calendar';

interface Props {
  items: CalendarItem[];
  variant: 'month' | 'week' | 'plan';
  maxVisible?: number;
  onClick?: (item: CalendarItem) => void;
}

export function CalendarWorkoutStack({
  items,
  variant,
  maxVisible = 3,
  onClick,
}: Props) {
  const visible = items.slice(0, maxVisible);

  if (visible.length === 0) {
    return null;
  }

  // Calculate scale factors for stacking
  const getScale = (index: number): number => {
    if (index === 0) return 1.0;
    if (index === 1) return 0.97;
    if (index === 2) return 0.94;
    return 0.91 - (index - 3) * 0.03;
  };

  // Calculate offset for stacking (6px per layer)
  const getOffset = (index: number): { x: number; y: number } => {
    return {
      x: index * 6,
      y: index * 6,
    };
  };

  return (
    <div className="relative w-full h-full">
      {visible.map((item, i) => {
        const offset = getOffset(i);
        const scale = getScale(i);
        const isTopCard = i === 0;

        return (
          <div
            key={item.id}
            className="absolute inset-0 transition-all duration-[140ms] ease-out"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'top left',
              zIndex: visible.length - i,
              pointerEvents: isTopCard ? 'auto' : 'none',
            }}
            onMouseEnter={(e) => {
              if (isTopCard) {
                e.currentTarget.style.transform = `translate(${offset.x}px, ${offset.y - 2}px) scale(${scale * 1.01})`;
              }
            }}
            onMouseLeave={(e) => {
              if (isTopCard) {
                e.currentTarget.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
              }
            }}
            onClick={() => {
              if (isTopCard && onClick) {
                onClick(item);
              }
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                aspectRatio: '360 / 460',
                height: variant === 'month' ? '98%' : 'auto',
                maxHeight: variant === 'month' ? '100%' : '100%',
                maxWidth: '100%',
              }}
            >
              <CalendarWorkoutCard {...toCalendarCardProps(item)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
