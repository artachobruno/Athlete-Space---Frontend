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
import { toCalendarItem } from '@/adapters/calendarAdapter';

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
      toCalendarItem(s, dayData.completedActivities)
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
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
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
          <div className="grid grid-cols-7 grid-rows-6 min-h-[960px]">
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const items = getCalendarItemsForDay(day);

              return (
                <DroppableDayCell
                  key={idx}
                  date={day}
                  className={cn(
                    'relative min-h-[160px] border-b border-r border-border flex flex-col',
                    !isCurrentMonth && 'bg-muted/30',
                    idx % 7 === 6 && 'border-r-0'
                  )}
                >
                  {/* Day number */}
                  <div className="px-2 pt-2">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        !isCurrentMonth && 'text-muted-foreground',
                        isCurrentDay &&
                          'bg-accent text-accent-foreground w-6 h-6 rounded-full inline-flex items-center justify-center'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* SVG cards */}
                  <div className="relative flex-1">
                    {items.length > 0 && (
                      <div className="absolute top-[1%] left-[1%] right-[1%] bottom-[1%]">
                        <CalendarWorkoutStack
                          items={items}
                          variant="month"
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
                                  (session?.workout_id && a.workout_id === session.workout_id)
                              ) ?? null;

                            onActivityClick?.(null, activity, session ?? undefined);
                          }}
                        />
                      </div>
                    )}
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
    </div>
  );
}
