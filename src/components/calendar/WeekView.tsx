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
    <div className="space-y-3">
      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const groupedItems = getGroupedItemsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-lg border border-border/60 bg-card min-h-[340px] flex flex-col',
                isCurrentDay && 'ring-1 ring-accent/40 border-accent/30'
              )}
            >
              {/* Day Header - compact telemetry style */}
              <div
                className="px-2 py-1.5 border-b border-border/40 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setSelectedDay(day)}
              >
                <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                  {format(day, 'EEE').toUpperCase()}
                </p>
                <p
                  className={cn(
                    'text-lg font-semibold tabular-nums tracking-tight',
                    isCurrentDay ? 'text-accent' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>

              {/* Card Area */}
              <div className="flex-1 relative">
                <div className="absolute top-0 left-0 right-0 bottom-0">
                  {groupedItems.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider opacity-50">🧠 Adaptation day</p>
                    </div>
                  ) : (() => {
                    const flatItems = groupedItems.flatMap((g) => g.items);
                    const stackItems = sortCalendarItems(flatItems);
                    const topItem = stackItems[0];
                    // Priority: must_dos > execution_notes > instructions[0]
                    const hasInstructions = topItem?.mustDos?.length || topItem?.executionNotes || (monthData && (() => {
                      const session = [...monthData.planned_sessions, ...monthData.workouts].find(
                        (s) => s.id === topItem.id
                      );
                      return session?.must_dos?.length || (session?.instructions && session.instructions.length > 0);
                    })());
                    const instructionText = topItem?.mustDos?.[0] || topItem?.executionNotes || (monthData && (() => {
                      const session = [...monthData.planned_sessions, ...monthData.workouts].find(
                        (s) => s.id === topItem.id
                      );
                      return session?.must_dos?.[0] || session?.instructions?.[0];
                    })());

                    return (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 min-h-0">
                          <CalendarWorkoutStack
                            items={stackItems}
                            variant="week"
                            maxVisible={3}
                            onClick={handleCardClick}
                            activityIdBySessionId={activityIdBySessionId}
                            useNewCard
                          />
                        </div>
                        {/* Instruction / Must-Do box - below workout card */}
                        {hasInstructions && instructionText && (
                          <div className="flex-shrink-0 mt-1 px-2 py-1.5 border-t border-border/40 bg-muted/20 rounded-b">
                            <div className="flex items-start gap-1.5">
                              <span className="text-[9px] text-muted-foreground/60 mt-0.5">→</span>
                              <p className="text-[10px] leading-relaxed text-muted-foreground flex-1">
                                {instructionText}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
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
