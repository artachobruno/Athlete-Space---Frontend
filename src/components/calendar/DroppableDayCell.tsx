import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DroppableDayCellProps {
  date: Date;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a calendar day cell to make it a drop target for planned sessions.
 */
export function DroppableDayCell({ date, children, className }: DroppableDayCellProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { isOver, setNodeRef } = useDroppable({
    id: `day-${dateStr}`,
    data: {
      type: 'day',
      date: dateStr,
      dateObj: date,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
      )}
    >
      {children}
    </div>
  );
}
