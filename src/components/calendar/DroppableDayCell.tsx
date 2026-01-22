import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface DroppableDayCellProps {
  date: Date;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wraps a calendar day cell to make it a drop target for planned sessions.
 */
export function DroppableDayCell({ date, children, className, style }: DroppableDayCellProps) {
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
        // Base transition for smooth hover/focus effects
        'transition-colors duration-150',
        // Hover state - subtle background highlight
        'hover:bg-muted/60',
        // Focus state - keyboard navigation support
        'focus-within:ring-1 focus-within:ring-primary/30 focus-within:bg-muted/40',
        className,
        // Drag-over state - higher priority styling
        isOver && 'ring-2 ring-primary ring-offset-1 bg-primary/10'
      )}
      style={style}
      tabIndex={0}
      role="gridcell"
      aria-label={`Day ${format(date, 'EEEE, MMMM d')}`}
    >
      {children}
    </div>
  );
}
