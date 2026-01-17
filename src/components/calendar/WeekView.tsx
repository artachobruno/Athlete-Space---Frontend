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
import {
  Loader2,
  Zap,
  Clock,
  TrendingUp,
  Share2,
  Copy,
  Download,
  Sparkles,
} from 'lucide-react';
import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { DayView } from './DayView';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CalendarItem, GroupedCalendarItem } from '@/types/calendar';
import { groupDuplicateSessions } from '@/types/calendar';
import { sortCalendarItems } from './cards/sortCalendarItems';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { fetchOverview } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useQuery } from '@tanstack/react-query';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { toCalendarItem, capitalizeTitle } from '@/adapters/calendarAdapter';
import { normalizeSportType, mapIntensityToIntent } from '@/lib/session-utils';
import {
  generateWeeklySummaryText,
  generateWeeklySummaryMarkdown,
  copyToClipboard,
  downloadTextFile,
  shareContent,
} from '@/lib/weekly-summary';

interface WeekViewProps {
  currentDate: Date;
  onActivityClick?: (
    planned: PlannedWorkout | null,
    completed: CompletedActivity | null,
    session?: CalendarSession | null
  ) => void;
}

function WeekView({ currentDate, onActivityClick }: WeekViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');

  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  const { data: overview } = useQuery({
    queryKey: ['overview', 14],
    queryFn: () => fetchOverview(14),
    retry: 1,
  });

  const dayDataMap = useMemo(() => {
    if (!monthData) return new Map<string, CalendarItem[]>();

    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, CalendarItem[]>();

    for (const day of normalizedDays) {
      if (day.date < format(weekStart, 'yyyy-MM-dd') ||
          day.date > format(weekEnd, 'yyyy-MM-dd')) {
        continue;
      }

      const items: CalendarItem[] = [];

      for (const session of day.plannedSessions) {
        items.push(toCalendarItem(session, monthData.completed_activities));
      }

      for (const workout of day.workouts) {
        if (!items.some(i => i.id === workout.id)) {
          items.push(toCalendarItem(workout, monthData.completed_activities));
        }
      }

      map.set(day.date, items);
    }

    return map;
  }, [monthData, weekStart, weekEnd]);

  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const getGroupedItemsForDay = (date: Date): GroupedCalendarItem[] => {
    const items = dayDataMap.get(format(date, 'yyyy-MM-dd'));
    return items && items.length > 0 ? groupDuplicateSessions(items) : [];
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

  if (selectedDay) {
    const items = dayDataMap.get(format(selectedDay, 'yyyy-MM-dd')) || [];
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
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, idx) => {
          const groupedItems = getGroupedItemsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-xl border border-border bg-card min-h-[320px] flex flex-col',
                isCurrentDay && 'ring-2 ring-primary/50'
              )}
            >
              {/* Day Header */}
              <div
                className="px-3 py-2 border-b border-border cursor-pointer hover:bg-muted/30"
                onClick={() => setSelectedDay(day)}
              >
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  {format(day, 'EEE')}
                </p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    isCurrentDay ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>

              {/* Card Area — 98% FILL */}
              <div className="flex-1 relative">
                <div className="absolute top-[1%] left-[1%] right-[1%] bottom-[1%]">
                  {groupedItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground/50">Rest day</p>
                    </div>
                  ) : (() => {
                    const flatItems = groupedItems.flatMap((g) => g.items);
                    const stackItems = sortCalendarItems(flatItems);
                    return (
                      <CalendarWorkoutStack
                        items={stackItems}
                        variant="week"
                        maxVisible={3}
                        onClick={handleCardClick}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { WeekView };
export default WeekView;
