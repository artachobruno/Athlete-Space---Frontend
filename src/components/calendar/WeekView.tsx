import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  parseISO,
  isPast,
  startOfMonth,
} from 'date-fns';

import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { fetchCalendarMonth, normalizeCalendarMonth, type DayCalendarData } from '@/lib/calendar-month';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useUpdatePlannedSession, useUpdateWorkoutDate } from '@/hooks/useCalendarMutations';
import { markDragOperationComplete } from '@/hooks/useAutoMatchSessions';
import { toast } from '@/hooks/use-toast';

import type { CalendarSession } from '@/lib/api';
import type { PlannedWorkout, CompletedActivity } from '@/types';

import { DroppableDayCell } from './DroppableDayCell';
import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { toCalendarItem } from '@/adapters/calendarAdapter';

interface WeekViewProps {
  currentDate: Date;
  onActivityClick?: (
    planned: PlannedWorkout | null,
    completed: CompletedActivity | null,
    session?: CalendarSession | null
  ) => void;
}

export function WeekView({ currentDate, onActivityClick }: WeekViewProps) {
  const queryClient = useQueryClient();
  const updateSession = useUpdatePlannedSession();
  const updateWorkout = useUpdateWorkoutDate();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedSession, setDraggedSession] = useState<CalendarSession | null>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const monthKey = format(startOfMonth(currentDate), 'yyyy-MM');

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

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const allPlannedSessionIds = useMemo(() => {
    if (!monthData) return [];
    return monthData.planned_sessions
      .filter((s) => s.date >= format(weekStart, 'yyyy-MM-dd') && s.date <= format(weekEnd, 'yyyy-MM-dd'))
      .map((s) => s.id);
  }, [monthData, weekStart, weekEnd]);

  const handleDragStart = (event: DragStartEvent) => {
    const session = event.active.data.current?.session as CalendarSession | undefined;
    if (!session?.planned_session_id) return;
    setActiveId(event.active.id as string);
    setDraggedSession(session);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedSession(null);

    if (!over) return;

    const session = active.data.current?.session as CalendarSession | undefined;
    const targetDate = over.data.current?.date as string | undefined;

    if (!session || !targetDate) return;

    const oldDate = session.date ? format(parseISO(session.date), 'yyyy-MM-dd') : '';
    if (oldDate === targetDate) return;

    const sessionDate = session.date ? parseISO(session.date) : null;
    if (sessionDate && isPast(sessionDate) && !isToday(sessionDate)) {
      toast({ title: 'Session moved', description: 'You moved a past session.' });
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
            queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
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
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={allPlannedSessionIds} strategy={verticalListSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayData = dayDataMap.get(dateKey);
            const isCurrentDay = isToday(day);

            const items =
              dayData && monthData
                ? [
                    ...dayData.plannedSessions.map((s) =>
                      toCalendarItem(s, monthData.completed_activities)
                    ),
                    ...dayData.workouts
                      .filter((s) => !dayData.plannedSessions.some((p) => p.id === s.id))
                      .map((s) =>
                        toCalendarItem(s, monthData.completed_activities)
                      ),
                  ]
                : [];

            return (
              <DroppableDayCell key={dateKey} date={day}>
                <div
                  className={cn(
                    'relative min-h-[320px] rounded-lg border border-border bg-card',
                    isCurrentDay && 'ring-2 ring-accent'
                  )}
                >
                  {/* Day header */}
                  <div className="px-3 pt-3">
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'EEEE')}
                    </div>
                    <div className="text-lg font-semibold">
                      {format(day, 'd')}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="relative flex-1 px-2 pb-2">
                    {items.length > 0 && (
                      <div className="absolute inset-[6px]">
                        <CalendarWorkoutStack
                          items={items}
                          variant="week"
                          maxVisible={3}
                          onClick={(item) => {
                            if (!monthData) return;

                            const session =
                              [
                                ...monthData.planned_sessions,
                                ...monthData.workouts,
                              ].find((s) => s.id === item.id) ?? null;

                            const activity =
                              monthData.completed_activities.find(
                                (a) =>
                                  a.planned_session_id === item.id ||
                                  (session?.workout_id &&
                                    a.workout_id === session.workout_id)
                              ) ?? null;

                            onActivityClick?.(
                              null,
                              activity,
                              session ?? undefined
                            );
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </DroppableDayCell>
            );
          })}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId && draggedSession && (
          <div className="px-2 py-1 text-xs rounded bg-muted shadow">
            {draggedSession.title || 'Workout'}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
