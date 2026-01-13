import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { PlannedWorkout } from '@/types';
import type { CalendarSession } from '@/lib/api';

interface DraggablePlannedSessionProps {
  session: CalendarSession;
  workout: PlannedWorkout;
  isCompleted: boolean;
  matchingActivity?: import('@/types').CompletedActivity | null;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps a planned session card to make it draggable.
 * Uses @dnd-kit for drag-and-drop functionality.
 * Disables dragging when the matching activity is paired.
 */
export function DraggablePlannedSession({
  session,
  workout,
  isCompleted,
  matchingActivity,
  onClick,
  children,
  className,
}: DraggablePlannedSessionProps) {
  // Check if activity is paired (has planned_session_id)
  const isPaired = Boolean(matchingActivity?.planned_session_id);
  const enableDnD = !isPaired;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: session.id,
    disabled: !enableDnD,
    data: {
      type: 'planned-session',
      session,
      workout,
      isCompleted,
      matchingActivity,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(enableDnD ? attributes : {})}
      {...(enableDnD ? listeners : {})}
      className={cn(
        className,
        enableDnD && isDragging && 'cursor-grabbing',
        enableDnD && !isDragging && 'cursor-grab',
        !enableDnD && 'cursor-default'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
