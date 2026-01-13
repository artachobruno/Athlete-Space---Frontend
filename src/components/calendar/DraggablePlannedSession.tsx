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
 * 
 * CRITICAL: Click ≠ Drag
 * - Click area: Opens session modal
 * - Drag handle: Only small area for dragging
 * - Drag only allowed when planned_session_id exists
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
  
  // Drag only allowed when:
  // 1. Not paired (no completed_activity_id)
  // 2. Has planned_session_id (required for move API)
  const canDrag = !isPaired && !!session.planned_session_id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: session.id,
    disabled: !canDrag,
    data: {
      type: 'planned-session',
      session,
      workout,
      isCompleted,
      matchingActivity,
    },
  });

  const style = canDrag ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  // When drag is disabled, render without drag handlers
  if (!canDrag) {
    return (
      <div
        className={cn(className, 'cursor-pointer')}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  // When drag is enabled, separate click area from drag handle
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(className, 'session-card relative')}
    >
      {/* CLICK AREA - Opens session modal */}
      <div
        className="session-content cursor-pointer"
        onClick={onClick}
      >
        {children}
      </div>

      {/* DRAG HANDLE - Only small area for dragging */}
      <div
        className="drag-handle absolute top-1 right-1 w-4 h-4 cursor-grab active:cursor-grabbing flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        {...attributes}
        {...listeners}
        onClick={(e) => {
          // Prevent click from bubbling to session-content
          e.stopPropagation();
        }}
        aria-label="Drag to move session"
      >
        <span className="text-xs">⠿</span>
      </div>
    </div>
  );
}
