// Week view rules:
// - Must fit entirely in viewport (no vertical scrolling)
// - Editable and drag/reorder enabled
// - Shows completion overlay
// - No metrics, no coaching text, no analytics

import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  startOfMonth,
  parseISO,
  isPast,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, GripVertical } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDraggable,
} from '@dnd-kit/core';

import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { DayView } from './DayView';
import { DroppableDayCell } from './DroppableDayCell';
import { Card } from '@/components/ui/card';
import { SessionCard } from '@/components/sessions/SessionCard';
import { toast } from '@/hooks/use-toast';

import type {
  CalendarItem,
  GroupedCalendarItem,
} from '@/types/calendar';
import {
  groupDuplicateSessions,
} from '@/types/calendar';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import {
  useUpdatePlannedSession,
  useUpdateWorkoutDate,
} from '@/hooks/useCalendarMutations';
import { markDragOperationComplete } from '@/hooks/useAutoMatchSessions';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import { normalizeSportType, mapIntensityToIntent } from '@/lib/session-utils';
import { toCalendarItem, capitalizeTitle } from '@/adapters/calendarAdapter';

interface WeekCalendarProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: CalendarSession | null) => void;
}

/**
 * DraggableSessionWrapper - Wraps a session card for drag-and-drop
 */
function DraggableSessionWrapper({
  item,
  session,
  children,
  onClick,
}: {
  item: CalendarItem;
  session: CalendarSession | null;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  // Only allow dragging planned sessions that aren't completed
  const canDrag = session?.planned_session_id && !session?.completed_activity_id;
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    disabled: !canDrag,
    data: {
      type: 'planned-session',
      session,
      item,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group transition-all duration-200',
        isDragging && 'opacity-40 scale-95',
        canDrag && 'cursor-grab active:cursor-grabbing'
      )}
      onClick={onClick}
    >
      {children}
      {/* Drag handle indicator - visible on hover */}
      {canDrag && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100',
            'bg-background/80 backdrop-blur-sm border border-border/50',
            'transition-opacity duration-150 cursor-grab active:cursor-grabbing'
          )}
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to move session"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

/**
 * WeekCalendar Component
 *
 * Expanded week view with vertical stacking, drag-and-drop support,
 * and smooth animations for session moves.
 */
export function WeekCalendar({ currentDate, onActivityClick }: WeekCalendarProps) {
  const queryClient = useQueryClient();
  const updateSession = useUpdatePlannedSession();
  const updateWorkout = useUpdateWorkoutDate();
  
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null);
  const [dragSourceDate, setDragSourceDate] = useState<string | null>(null);
  const [recentlyDropped, setRecentlyDropped] = useState<string | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  // Convert to CalendarItems grouped by day
  const dayDataMap = useMemo(() => {
    if (!monthData) return new Map<string, CalendarItem[]>();

    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, CalendarItem[]>();

    for (const day of normalizedDays) {
      // Filter to week range
      if (day.date < weekStartStr || day.date > weekEndStr) continue;

      const items: CalendarItem[] = [];

      for (const session of day.plannedSessions) {
        items.push(toCalendarItem(session, monthData.completed_activities || []));
      }

      for (const workout of day.workouts) {
        if (!items.some(i => i.id === workout.id)) {
          items.push(toCalendarItem(workout, monthData.completed_activities || []));
        }
      }

      map.set(day.date, items);
    }

    return map;
  }, [monthData, weekStartStr, weekEndStr]);

  const activityIdBySessionId = useMemo(() => {
    if (!monthData) return {};
    const map: Record<string, string> = {};
    for (const session of [...monthData.planned_sessions, ...monthData.workouts]) {
      if (session.completed_activity_id) {
        map[session.id] = session.completed_activity_id;
      }
    }
    for (const activity of monthData.completed_activities || []) {
      if (activity.planned_session_id) {
        map[activity.planned_session_id] = activity.id;
      }
    }
    return map;
  }, [monthData]);

  // Build session lookup for drag-and-drop
  const sessionById = useMemo(() => {
    if (!monthData) return new Map<string, CalendarSession>();
    const map = new Map<string, CalendarSession>();
    for (const s of [...monthData.planned_sessions, ...monthData.workouts]) {
      map.set(s.id, s);
    }
    return map;
  }, [monthData]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  const getGroupedItemsForDay = (date: Date): GroupedCalendarItem[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const items = dayDataMap.get(dateStr);
    if (!items || items.length === 0) return [];
    return groupDuplicateSessions(items);
  };

  const handleCardClick = (item: CalendarItem) => {
    if (monthData && onActivityClick) {
      const session = [...monthData.planned_sessions, ...monthData.workouts].find(
        (s) => s.id === item.id
      );
      const activity = monthData.completed_activities.find(
        (a) => a.id === item.id || a.planned_session_id === item.id
      );

      onActivityClick(
        session
          ? {
              id: session.id,
              date: session.date || '',
              sport: normalizeSportType(session.type),
              intent: mapIntensityToIntent(session.intensity),
              title: capitalizeTitle(session.title || ''),
              description: session.notes || '',
              duration: session.duration_minutes || 0,
              completed: session.status === 'completed',
            }
          : null,
        activity || null,
        session
      );
    }
  };

  // Drag-and-drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as CalendarItem | undefined;
    const session = event.active.data.current?.session as CalendarSession | undefined;
    if (!item) return;
    
    setActiveId(event.active.id as string);
    setDraggedItem(item);
    // Track source date for ghost placeholder
    if (session?.date) {
      setDragSourceDate(format(parseISO(session.date), 'yyyy-MM-dd'));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedItem(null);
    setDragSourceDate(null);
    
    if (!over) return;
    
    const session = active.data.current?.session as CalendarSession | undefined;
    const targetDate = over.data.current?.date as string | undefined;
    
    if (!session || !targetDate) return;
    
    const oldDate = session.date ? format(parseISO(session.date), 'yyyy-MM-dd') : '';
    if (oldDate === targetDate) return;
    
    // Check if moving a past session
    const sessionDate = session.date ? parseISO(session.date) : null;
    const isPastSession = sessionDate && isPast(sessionDate) && !isToday(sessionDate);
    
    if (isPastSession) {
      toast({
        title: 'Session moved',
        description: 'You moved a past session.',
      });
    }
    
    if (!session.planned_session_id) {
      toast({
        title: 'Move failed',
        description: 'Missing planned session ID.',
        variant: 'destructive',
      });
      return;
    }
    
    // Trigger drop animation
    setRecentlyDropped(session.id);
    setTimeout(() => setRecentlyDropped(null), 600);
    
    // Perform the move
    if (session.workout_id) {
      updateWorkout.mutate(
        { workoutId: session.workout_id, scheduledDate: targetDate },
        {
          onSuccess: () => {
            markDragOperationComplete();
            queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
            toast({
              title: 'Session moved',
              description: `Moved to ${format(parseISO(targetDate), 'EEEE, MMM d')}`,
            });
          },
        }
      );
    } else {
      updateSession.mutate(
        { sessionId: session.planned_session_id, scheduledDate: targetDate },
        {
          onSuccess: () => {
            markDragOperationComplete();
            queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
            toast({
              title: 'Session moved',
              description: `Moved to ${format(parseISO(targetDate), 'EEEE, MMM d')}`,
            });
          },
        }
      );
    }
  };

  // Show day view if a day is selected
  if (selectedDay) {
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const items = dayDataMap.get(dateStr) || [];

    return (
      <DayView
        date={selectedDay}
        items={items}
        onBack={() => setSelectedDay(null)}
        onItemClick={handleCardClick}
      />
    );
  }

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading week...</span>
      </Card>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col min-h-0">
        {/* Week Grid - 7 equal columns, fills available height */}
        <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
          {days.map((day, idx) => {
            const groupedItems = getGroupedItemsForDay(day);
            const isCurrentDay = isToday(day);
            const dayItems = dayDataMap.get(format(day, 'yyyy-MM-dd')) || [];
            const dayTotal = dayItems.reduce((sum, i) => sum + i.durationMin, 0);

            return (
              <DroppableDayCell
                key={idx}
                date={day}
                className={cn(
                  'rounded-lg border bg-card text-card-foreground shadow-sm',
                  'flex flex-col min-h-0 overflow-hidden transition-all duration-150',
                  // Hover state - subtle lift and highlight
                  'hover:shadow-md hover:border-border/80',
                  // Focus state - keyboard navigation
                  'focus-within:ring-2 focus-within:ring-primary/40 focus-within:shadow-md',
                  // Today highlight
                  isCurrentDay && 'ring-2 ring-primary/50 bg-primary/[0.02]',
                )}
              >
                {/* Day Header - fixed height, clickable */}
                <div
                  className={cn(
                    'flex-shrink-0 px-2 py-1.5 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors',
                    isCurrentDay && 'bg-primary/5',
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {format(day, 'EEE')}
                      </p>
                      <p
                        className={cn(
                          'text-base font-semibold tabular-nums',
                          isCurrentDay ? 'text-primary' : 'text-foreground',
                        )}
                      >
                        {format(day, 'd')}
                      </p>
                    </div>
                    {dayTotal > 0 && (
                      <span className="text-[10px] text-muted-foreground tabular-nums">{dayTotal}m</span>
                    )}
                  </div>
                </div>

                {/* Workout Cards - scrollable content area with drag-and-drop */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-1">
                  {groupedItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[10px] text-muted-foreground/50">Rest</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {groupedItems.flatMap((group) => group.items).map((item) => {
                        const session = sessionById.get(item.id) || null;
                        const isDropped = recentlyDropped === item.id;
                        const isDragging = activeId === item.id;
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const isGhostSource = dragSourceDate === dayStr && isDragging;
                        
                        return (
                          <DraggableSessionWrapper
                            key={item.id}
                            item={item}
                            session={session}
                            onClick={() => handleCardClick(item)}
                          >
                            {/* Ghost placeholder - shown at original position during drag */}
                            {isGhostSource && (
                              <div className="absolute inset-0 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 animate-pulse" />
                            )}
                            <div
                              className={cn(
                                'transition-all duration-300',
                                // Drop animation - scale and glow effect
                                isDropped && 'animate-scale-in ring-2 ring-primary/50 shadow-lg',
                                // Dragging state - reduced opacity
                                isDragging && 'opacity-30'
                              )}
                            >
                              <SessionCard
                                session={item}
                                density="standard"
                                className="h-full"
                              />
                            </div>
                          </DraggableSessionWrapper>
                        );
                      })}
                    </div>
                  )}
                </div>
              </DroppableDayCell>
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - follows cursor during drag */}
      <DragOverlay>
        {activeId && draggedItem && (
          <div className="opacity-90 shadow-xl rounded-lg ring-2 ring-primary animate-scale-in">
            <SessionCard
              session={draggedItem}
              density="standard"
              className="w-[200px]"
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
