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
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

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
import { Loader2 } from 'lucide-react';

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
  const [draggedSession, setDraggedSession] =
    useState<CalendarSession | null>(null);

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
    const session = event.active.data.current?.session as
      | CalendarSession
      | undefined;

    if (!session?.planned_session_id) return;

    setActiveId(event.active.id as string);
    setDraggedSession(session);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedSession(null);

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
        <SortableContext
          items={allPlannedSessionIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const items = getCalendarItemsForDay(day);

              return (
                <DroppableDayCell
                  key={idx}
                  date={day}
                  className={cn(
                    'relative min-h-[180px] border-b border-r border-border/50 flex flex-col transition-colors',
                    !isCurrentMonth && 'bg-muted/5',
                    isCurrentDay && 'bg-primary/5',
                    idx % 7 === 6 && 'border-r-0'
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

                  {/* Workout cards - vertical stack layout (no absolute positioning) */}
                  <div className="flex-1 flex flex-col gap-1 p-1 overflow-y-auto min-h-0">
                    {items.length > 0 ? (() => {
                      const sortedItems = sortCalendarItems(items);
                      const visibleItems = sortedItems.slice(0, 3);
                      const remainingCount = sortedItems.length - 3;
                      const topItem = visibleItems[0];
                      const hasExecutionNotes = topItem?.executionNotes;

                      return (
                        <>
                          {visibleItems.map((item, idx) => (
                            <div
                              key={item.id}
                              className="flex-shrink-0 relative"
                              style={{ height: idx === 0 ? 'auto' : '60px' }}
                            >
                              <CalendarWorkoutStack
                                items={[item]}
                                variant="month"
                                maxVisible={1}
                                activityIdBySessionId={activityIdBySessionId}
                                useNewCard
                                onClick={(clickedItem) => {
                                  if (!monthData) return;

                                  const session =
                                    [
                                      ...monthData.planned_sessions,
                                      ...monthData.workouts,
                                    ].find((s) => s.id === clickedItem.id) ?? null;

                                  const activity =
                                    monthData.completed_activities.find(
                                      (a) =>
                                        a.planned_session_id === clickedItem.id ||
                                        (session?.workout_id && a.workout_id === session.workout_id)
                                    ) ?? null;

                                  onActivityClick?.(null, activity, session ?? undefined);
                                }}
                              />
                              {/* Execution notes indicator - only on first card */}
                              {idx === 0 && hasExecutionNotes && (
                                <div
                                  className="absolute top-1 right-1 z-10"
                                  title={topItem.executionNotes || undefined}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                                </div>
                              )}
                            </div>
                          ))}
                          {remainingCount > 0 && (
                            <div className="flex-shrink-0 text-[9px] text-muted-foreground/60 text-center py-1">
                              +{remainingCount} more
                            </div>
                          )}
                        </>
                      );
                    })() : null}
                  </div>
                </DroppableDayCell>
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId && draggedSession && (
            <div className="px-3 py-1.5 text-sm rounded-md bg-card border border-border shadow-lg">
              {capitalizeTitle(draggedSession.title || 'Workout')}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </Card>
  );
}
