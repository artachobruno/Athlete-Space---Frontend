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
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Clock, Star } from 'lucide-react';
import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { DayView } from './DayView';
import type {
  CalendarItem,
  DaySummary,
  GroupedCalendarItem,
} from '@/types/calendar';
import {
  groupDuplicateSessions,
  normalizeCalendarSport,
  normalizeCalendarIntent,
  isQualitySession,
} from '@/types/calendar';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import { toCalendarItem } from '@/adapters/calendarAdapter';

/**
 * MonthCalendar Component
 *
 * Strava-clean month view with glass cards.
 */
export function MonthCalendar({ currentDate, onActivityClick }: {
  currentDate: Date;
  onActivityClick?: (
    planned: PlannedWorkout | null,
    completed: CompletedActivity | null,
    session?: CalendarSession | null
  ) => void;
}) {
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
    if (!monthData) return new Map<string, { items: CalendarItem[]; summary: DaySummary }>();

    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, { items: CalendarItem[]; summary: DaySummary }>();

    for (const day of normalizedDays) {
      const items: CalendarItem[] = [];

      for (const session of day.plannedSessions) {
        items.push(toCalendarItem(session, monthData.completed_activities));
      }

      for (const workout of day.workouts) {
        if (!items.some(i => i.id === workout.id)) {
          items.push(toCalendarItem(workout, monthData.completed_activities));
        }
      }

      const summary: DaySummary = {
        date: day.date,
        totalDuration: items.reduce((s, i) => s + i.durationMin, 0),
        totalLoad: items.reduce((s, i) => s + (i.load || 0), 0),
        qualitySessions: items.filter(i => isQualitySession(i.intent)).length,
        items,
      };

      map.set(day.date, { items, summary });
    }

    return map;
  }, [monthData]);

  const days = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const getGroupedItemsForDay = (date: Date): GroupedCalendarItem[] => {
    const key = format(date, 'yyyy-MM-dd');
    const day = dayDataMap.get(key);
    return day ? groupDuplicateSessions(day.items) : [];
  };

  const getSummaryForDay = (date: Date): DaySummary | null => {
    return dayDataMap.get(format(date, 'yyyy-MM-dd'))?.summary || null;
  };

  if (selectedDay) {
    const dayData = dayDataMap.get(format(selectedDay, 'yyyy-MM-dd'));
    return (
      <DayView
        date={selectedDay}
        items={dayData?.items || []}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map(day => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const groupedItems = getGroupedItemsForDay(day);
          const summary = getSummaryForDay(day);
          const hasItems = groupedItems.length > 0;
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[260px] relative flex flex-col border-b border-r border-border bg-muted/40',
                idx % 7 === 6 && 'border-r-0'
              )}
            >
              {/* Day header */}
              <div
                className="px-2 pt-2 pb-1 cursor-pointer"
                onClick={() => setSelectedDay(day)}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isCurrentDay &&
                      'bg-primary text-primary-foreground w-7 h-7 rounded-full inline-flex items-center justify-center font-bold'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Card area */}
              <div className="flex-1 relative">
                <div className="absolute inset-0 px-0.5 pb-0 backdrop-blur-xl backdrop-saturate-150">
                  {groupedItems.length > 0 && (
                    <CalendarWorkoutStack
                      items={groupedItems[0].items}
                      variant="month"
                      maxVisible={3}
                    />
                  )}
                </div>
              </div>

              {/* Footer */}
              {hasItems && summary && (
                <div className="px-2 py-1 border-t border-border/50 bg-muted/20">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <div className="flex gap-2">
                      <div className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        <span>{summary.totalDuration}m</span>
                      </div>
                      {summary.totalLoad > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Zap className="h-3 w-3" />
                          <span>{Math.round(summary.totalLoad)}</span>
                        </div>
                      )}
                    </div>
                    {summary.qualitySessions > 0 && (
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span>{summary.qualitySessions}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
