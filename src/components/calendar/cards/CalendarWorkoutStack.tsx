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
  maxVisible = 3,
  onClick,
}: Props) {
  const visible = items.slice(0, maxVisible);

  return (
    <div className="relative w-full h-full group">
      {visible.map((item, i) => {
        const offset = i * 6;
        const scale = 1 - i * 0.04;

        return (
          <div
            key={item.id}
            className="absolute inset-0 transition-transform duration-150 ease-out
                       group-hover:-translate-y-[2px]
                       group-hover:scale-[1.01]
                       active:scale-[0.98]"
            style={{
              transform: `translate(${offset}px, ${offset}px) scale(${scale})`,
              zIndex: visible.length - i,
            }}
            onClick={() => onClick?.(item)}
          >
            <CalendarWorkoutCard {...toCalendarCardProps(item)} />
          </div>
        );
      })}
    </div>
  );
}
