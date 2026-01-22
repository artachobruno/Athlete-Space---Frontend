// Month view rules:
// - Must fit entirely in viewport (no vertical scrolling)
// - Pattern recognition only
// - Icons + labels
// - No detailed stats
// - No editing inside cells

import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
  isPast,
} from 'date-fns';

import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDraggable,
} from '@dnd-kit/core';

import { Card } from '@/components/ui/card';
import {
  fetchCalendarMonth,
  normalizeCalendarMonth,
  type DayCalendarData,
} from '@/lib/calendar-month';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import {
  useUpdatePlannedSession,
  useUpdateWorkoutDate,
} from '@/hooks/useCalendarMutations';
import { markDragOperationComplete } from '@/hooks/useAutoMatchSessions';
import { toast } from '@/hooks/use-toast';

import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import type { CalendarItem } from '@/types/calendar';

import { DroppableDayCell } from './DroppableDayCell';
import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { toCalendarItem, capitalizeTitle } from '@/adapters/calendarAdapter';
import { sortCalendarItems } from './cards/sortCalendarItems';
import { SessionCard } from '@/components/sessions/SessionCard';
import { Loader2, GripVertical } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  onActivityClick?: (
    planned: PlannedWorkout | null,
    completed: CompletedActivity | null,
    session?: CalendarSession | null
  ) => void;
}

export function MonthView({ currentDate, onActivityClick }: MonthViewProps) {
  const queryClient = useQueryClient();
  const updateSession = useUpdatePlannedSession();
  const updateWorkout = useUpdateWorkoutDate();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedSession, setDraggedSession] = useState<CalendarSession | null>(null);
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null);
  const [recentlyDropped, setRecentlyDropped] = useState<string | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');

  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  const dayDataMap = useMemo(() => {
    if (!monthData) return new Map<string, DayCalendarData>();
    const normalized = normalizeCalendarMonth(monthData);
    return new Map(normalized.map((d) => [d.date, d]));
  }, [monthData]);

  const days = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const allPlannedSessionIds = useMemo(() => {
    if (!monthData) return [];
    return monthData.planned_sessions.map((s) => s.id);
  }, [monthData]);

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

  const getCalendarItemsForDay = (date: Date): CalendarItem[] => {
    if (!monthData) return [];

    const dayKey = format(date, 'yyyy-MM-dd');
    const dayData = dayDataMap.get(dayKey);
    if (!dayData) return [];

    const sessions = [
      ...dayData.plannedSessions,
      ...dayData.workouts.filter(
        (w) => !dayData.plannedSessions.some((p) => p.id === w.id)
      ),
    ];

    return sessions.map((s) =>
      toCalendarItem(s, monthData.completed_activities)
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    const session = event.active.data.current?.session as CalendarSession | undefined;
    const item = event.active.data.current?.item as CalendarItem | undefined;

    if (!session?.planned_session_id) return;

    setActiveId(event.active.id as string);
    setDraggedSession(session);
    setDraggedItem(item || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedSession(null);
    setDraggedItem(null);

    if (!over) return;

    const session = active.data.current?.session as
      | CalendarSession
      | undefined;
    const targetDate = over.data.current?.date as string | undefined;

    if (!session || !targetDate) return;

    const oldDate = session.date
      ? format(parseISO(session.date), 'yyyy-MM-dd')
      : '';

    if (oldDate === targetDate) return;

    const sessionDate = session.date ? parseISO(session.date) : null;
    const isPastSession =
      sessionDate && isPast(sessionDate) && !isToday(sessionDate);

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

    if (session.workout_id) {
      updateWorkout.mutate(
        { workoutId: session.workout_id, scheduledDate: targetDate },
        {
          onSuccess: () => {
            markDragOperationComplete();
            queryClient.invalidateQueries({
              queryKey: ['calendar'],
              exact: false,
            });
            toast({
              title: 'Session moved',
              description: `Moved to ${format(parseISO(targetDate), 'EEE, MMM d')}`,
            });
          },
        }
      );
    } else {
      updateSession.mutate(
        {
          sessionId: session.planned_session_id,
          scheduledDate: targetDate,
        },
        {
          onSuccess: () => {
            markDragOperationComplete();
            queryClient.invalidateQueries({
              queryKey: ['calendar'],
              exact: false,
            });
            toast({
              title: 'Session moved',
              description: `Moved to ${format(parseISO(targetDate), 'EEE, MMM d')}`,
            });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <Card className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading calendar...</span>
      </Card>
    );
  }

  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {/* Header row - consistent with dashboard card headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30 flex-shrink-0">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
          {/* Month grid - fixed 6 rows, each row equal height */}
          <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const items = getCalendarItemsForDay(day);

              return (
                <DroppableDayCell
                  key={idx}
                  date={day}
                  className={cn(
                    'relative border-b border-r border-border/50 flex flex-col transition-all duration-150 min-h-0 overflow-hidden',
                    // Dimmed for non-current month
                    !isCurrentMonth && 'bg-muted/5 opacity-60',
                    // Hover state - subtle highlight
                    isCurrentMonth && 'hover:bg-muted/50',
                    // Today highlight
                    isCurrentDay && 'bg-primary/5 ring-1 ring-inset ring-primary/30',
                    // Grid borders
                    idx % 7 === 6 && 'border-r-0',
                    idx >= days.length - 7 && 'border-b-0'
                  )}
                >
                  {/* Day number */}
                  <div className="px-2 pt-1.5 pb-1">
                    <span
                      className={cn(
                        'text-sm font-medium tabular-nums',
                        !isCurrentMonth && 'text-muted-foreground/40',
                        isCurrentDay &&
                          'bg-primary text-primary-foreground w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-semibold'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Workout cards - vertical stack with overflow scroll */}
                  <div className="flex-1 flex flex-col gap-0.5 px-1 pb-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    {items.length > 0 && (() => {
                      const sortedItems = sortCalendarItems(items);
                      const visibleItems = sortedItems.slice(0, 3);
                      const remainingCount = sortedItems.length - 3;

                      return (
                        <>
                          {visibleItems.map((item) => (
                            <div key={item.id} className="flex-shrink-0">
                              <CalendarWorkoutStack
                                items={[item]}
                                variant="month"
                                maxVisible={1}
                                activityIdBySessionId={activityIdBySessionId}
                                useNewCard
                                onClick={(clickedItem) => {
                                  if (!monthData) return;
                                  const session =
                                    [...monthData.planned_sessions, ...monthData.workouts]
                                      .find((s) => s.id === clickedItem.id) ?? null;
                                  const activity =
                                    monthData.completed_activities.find(
                                      (a) =>
                                        a.planned_session_id === clickedItem.id ||
                                        (session?.workout_id && a.workout_id === session.workout_id)
                                    ) ?? null;
                                  onActivityClick?.(null, activity, session ?? undefined);
                                }}
                              />
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div className="flex-shrink-0 text-[9px] text-muted-foreground/60 text-center py-0.5">
                              +{remainingCount} more
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </DroppableDayCell>
              );
            })}
          </div>

        {/* Drag Overlay - follows cursor with smooth animation */}
        <DragOverlay>
          {activeId && draggedItem && (
            <div className="opacity-90 shadow-xl rounded-lg ring-2 ring-primary animate-scale-in">
              <SessionCard
                session={draggedItem}
                density="compact"
                className="w-[160px]"
              />
            </div>
          )}
          {activeId && draggedSession && !draggedItem && (
            <div className="px-3 py-1.5 text-sm rounded-md bg-card border border-border shadow-lg animate-scale-in">
              {capitalizeTitle(draggedSession.title || 'Workout')}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Card>
  );
}
