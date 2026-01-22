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
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { DayView } from './DayView';
import { Card } from '@/components/ui/card';
import type {
  CalendarItem,
  GroupedCalendarItem,
} from '@/types/calendar';
import {
  groupDuplicateSessions,
} from '@/types/calendar';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import { normalizeSportType, mapIntensityToIntent } from '@/lib/session-utils';
import { toCalendarItem, capitalizeTitle } from '@/adapters/calendarAdapter';

interface WeekCalendarProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: CalendarSession | null) => void;
}

/**
 * WeekCalendar Component
 *
 * Expanded week view with vertical stacking and more readable spacing.
 */
export function WeekCalendar({ currentDate, onActivityClick }: WeekCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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
    <div className="h-full flex flex-col min-h-0">
      {/* Week Grid - 7 equal columns, fills available height */}
      <div className="grid grid-cols-7 gap-2 flex-1 min-h-0">
        {days.map((day, idx) => {
          const groupedItems = getGroupedItemsForDay(day);
          const isCurrentDay = isToday(day);
          const dayItems = dayDataMap.get(format(day, 'yyyy-MM-dd')) || [];
          const dayTotal = dayItems.reduce((sum, i) => sum + i.durationMin, 0);

          return (
            <Card
              key={idx}
              className={cn(
                'flex flex-col min-h-0 overflow-hidden',
                isCurrentDay && 'ring-2 ring-primary/50',
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

              {/* Workout Cards - scrollable content area */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                {groupedItems.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-[10px] text-muted-foreground/50">Rest</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 p-1">
                    <CalendarWorkoutStack
                      items={groupedItems.flatMap((group) => group.items)}
                      variant="week"
                      onClick={handleCardClick}
                      maxVisible={4}
                      activityIdBySessionId={activityIdBySessionId}
                      useNewCard
                    />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
