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
import { MobileDayList } from './MobileDayList';
import { SwipeIndicator } from './SwipeIndicator';
import { toCalendarItem, capitalizeTitle } from '@/adapters/calendarAdapter';
import { sortCalendarItems } from './cards/sortCalendarItems';
import { SessionCard } from '@/components/sessions/SessionCard';
import { Loader2, GripVertical } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedSession, setDraggedSession] = useState<CalendarSession | null>(null);
  const [draggedItem, setDraggedItem] = useState<CalendarItem | null>(null);
  const [dragSourceDate, setDragSourceDate] = useState<string | null>(null);
  const [recentlyDropped, setRecentlyDropped] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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
    // Track source date for ghost placeholder
    if (session?.date) {
      setDragSourceDate(format(parseISO(session.date), 'yyyy-MM-dd'));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setDraggedSession(null);
    setDraggedItem(null);
    setDragSourceDate(null);

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

  // Mobile layout - stacked vertical list (only current month days)
  if (isMobile) {
    const currentMonthDays = days.filter(d => isSameMonth(d, currentDate));
    
    const handleMobileItemClick = (item: CalendarItem) => {
      if (!monthData) return;
      const session = [...monthData.planned_sessions, ...monthData.workouts]
        .find((s) => s.id === item.id) ?? null;
      const activity = monthData.completed_activities.find(
        (a) => a.planned_session_id === item.id ||
          (session?.workout_id && a.workout_id === session.workout_id)
      ) ?? null;
      onActivityClick?.(null, activity, session ?? undefined);
    };

    return (
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="px-3 py-2 border-b border-border bg-muted/30 flex-shrink-0">
          <h3 className="text-sm font-medium text-muted-foreground">
            {format(currentDate, 'MMMM yyyy')}
          </h3>
        </div>
        <SwipeIndicator label="month" className="flex-shrink-0 border-b border-border/50" />
        <MobileDayList
          days={currentMonthDays}
          getItemsForDay={getCalendarItemsForDay}
          onDayClick={setSelectedDay}
          onItemClick={handleMobileItemClick}
          showEmptyDays={false}
          className="flex-1 p-2"
        />
      </Card>
    );
  }

  // Desktop layout
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  return (
    <div className="overflow-hidden h-full flex flex-col">
      {/* Header row - transparent glass matching week view */}
      <div className="grid grid-cols-7 border-b border-white/10 flex-shrink-0 bg-transparent">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
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
          {/* Month grid - 6 rows with taller cells for cards */}
          <div className="grid grid-cols-7 flex-1 min-h-0" style={{ gridTemplateRows: 'repeat(6, minmax(100px, 1fr))' }}>
            {days.map((day, idx) => {
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);
              const items = getCalendarItemsForDay(day);

              return (
                <DroppableDayCell
                  key={idx}
                  date={day}
                  className={cn(
                    'relative border-b border-r border-white/10 flex flex-col transition-all duration-150 min-h-0 overflow-hidden',
                    'rounded-lg bg-transparent',
                    // Dimmed for non-current month
                    !isCurrentMonth && 'opacity-60',
                    // Hover state - subtle lift
                    isCurrentMonth && 'hover:shadow-md',
                    // Today highlight
                    isCurrentDay && 'ring-2 ring-primary/50 bg-primary/[0.02]',
                    // Grid borders
                    idx % 7 === 6 && 'border-r-0',
                    idx >= days.length - 7 && 'border-b-0'
                  )}
                >
                  {/* Day number - compact */}
                  <div className="px-1 pt-0.5 pb-0.5 flex-shrink-0">
                    <span
                      className={cn(
                        'text-xs font-medium tabular-nums',
                        !isCurrentMonth && 'text-muted-foreground/40',
                        isCurrentDay &&
                          'bg-primary text-primary-foreground w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-semibold'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Workout cards - compact vertical stack */}
                  <div className="flex-1 flex flex-col gap-px px-0.5 pb-0.5 min-h-0 overflow-y-auto overflow-x-hidden">
                    {items.length > 0 && (() => {
                      const sortedItems = sortCalendarItems(items);
                      const visibleItems = sortedItems.slice(0, 3);
                      const remainingCount = sortedItems.length - 3;
                      const dayStr = format(day, 'yyyy-MM-dd');

                      return (
                        <>
                          {visibleItems.map((item) => {
                            const isDragging = activeId === item.id;
                            const isGhostSource = dragSourceDate === dayStr && isDragging;
                            const isDropped = recentlyDropped === item.id;
                            
                            return (
                              <div 
                                key={item.id} 
                                className={cn(
                                  'flex-shrink-0 relative',
                                  isDragging && 'opacity-30'
                                )}
                              >
                                {/* Ghost placeholder - dashed border at original position */}
                                {isGhostSource && (
                                  <div className="absolute inset-0 rounded border-2 border-dashed border-primary/40 bg-primary/5 animate-pulse z-10" />
                                )}
                                <div
                                  className={cn(
                                    'transition-all duration-300',
                                    isDropped && 'animate-scale-in ring-2 ring-primary/50 shadow-lg'
                                  )}
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
                              </div>
                            );
                          })}
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
    </div>
  );
}
