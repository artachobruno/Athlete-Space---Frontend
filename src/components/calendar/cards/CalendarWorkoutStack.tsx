import { CalendarWorkoutCard } from './CalendarWorkoutCard';
import { CalendarActivityCard } from './CalendarActivityCard';
import { CalendarTrainingDayCard } from './CalendarTrainingDayCard';
import { toCalendarCardRenderModel } from './calendarCardAdapter';
import type { CalendarItem } from '@/types/calendar';

interface Props {
  items: CalendarItem[];
  variant: 'month' | 'week' | 'plan';
  maxVisible?: number;
  onClick?: (item: CalendarItem) => void;
  className?: string;
}

export function CalendarWorkoutStack({
  items,
  variant,
  maxVisible = 3,
  onClick,
  className,
}: Props) {
  const visible = items.slice(0, maxVisible);

  if (visible.length === 0) {
    return null;
  }

  const getScale = (index: number): number => {
    if (index === 0) return 1.0;
    if (index === 1) return 0.97;
    if (index === 2) return 0.94;
    return 0.91 - (index - 3) * 0.03;
  };

  const getOffset = (index: number): { x: number; y: number } => ({
    x: index * 6,
    y: index * 6,
  });

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
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
                e.currentTarget.style.transform = `translate(${offset.x}px, ${
                  offset.y - 2
                }px) scale(${scale * 1.01})`;
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
              className="flex items-center justify-center w-full h-full"
              style={
                variant === 'month'
                  ? {
                      // let the calendar cell define the height;
                      // keep subtle inset by scaling the card box
                      transform: 'scale(0.98)',
                      transformOrigin: 'top left',
                    }
                  : {
                      aspectRatio: '360 / 460',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }
              }
            >
              {(() => {
                const model = toCalendarCardRenderModel(item);

                if (model.cardType === 'session') {
                  return <CalendarWorkoutCard {...model.props} />;
                }

                if (model.cardType === 'activity') {
                  return <CalendarActivityCard {...model.props} />;
                }

                return <CalendarTrainingDayCard {...model.props} />;
              })()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
