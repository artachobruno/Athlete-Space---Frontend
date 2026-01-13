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
  // Check if session is paired (has completed_activity_id)
  // Frontend invariant: UI = lookup only, backend = authority
  const isPaired = Boolean(session.completed_activity_id);
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

  const style = enableDnD ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  // When paired (not draggable), render without drag handlers
  if (!enableDnD) {
    return (
      <div
        className={cn(className, 'cursor-default')}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        className,
        isDragging && 'cursor-grabbing',
        !isDragging && 'cursor-grab'
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
