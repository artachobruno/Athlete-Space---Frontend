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

interface MonthCalendarProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: CalendarSession | null) => void;
}

/**
 * Converts backend session data to CalendarItem format
 */
function sessionToCalendarItem(session: CalendarSession, activities: CompletedActivity[]): CalendarItem {
  // Find matching activity for compliance
  const matchingActivity = activities.find(a => 
    (session.workout_id && a.workout_id === session.workout_id) ||
    a.planned_session_id === session.id
  );
  
  const isCompleted = session.type === 'completed' || session.status === 'completed' || !!matchingActivity;
  
  // Extract load from activity if available
  const load = matchingActivity?.trainingLoad;
  
  // Extract secondary metric (pace, power, etc.) from activity
  let secondary: string | undefined = undefined;
  if (matchingActivity) {
    if (matchingActivity.avgPace) {
      secondary = matchingActivity.avgPace;
    } else if (matchingActivity.avgPower) {
      secondary = `${Math.round(matchingActivity.avgPower)}W`;
    } else if (matchingActivity.avgHeartRate) {
      secondary = `${matchingActivity.avgHeartRate} bpm`;
    }
  }
  
  // Build startLocal from date + time
  let startLocal = session.date;
  if (session.time) {
    startLocal = `${session.date}T${session.time}:00`;
  } else {
    startLocal = `${session.date}T00:00:00`;
  }
  
  // Determine compliance
  let compliance: 'complete' | 'partial' | 'missed' | undefined = undefined;
  if (isCompleted) {
    if (matchingActivity) {
      compliance = 'complete';
    } else if (session.status === 'completed') {
      compliance = 'complete';
    }
  }
  
  return {
    id: session.id,
    kind: isCompleted ? 'completed' : 'planned',
    sport: normalizeCalendarSport(session.type),
    intent: normalizeCalendarIntent(session.intensity),
    title: session.title || '',
    startLocal,
    durationMin: session.duration_minutes || 0,
    load,
    secondary,
    isPaired: !!matchingActivity || !!session.workout_id,
    compliance,
  };
}

/**
 * MonthCalendar Component
 * 
 * Strava-clean month view with compact cards and daily summary footer.
 */
export function MonthCalendar({ currentDate, onActivityClick }: MonthCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');
  
  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  // Convert to CalendarItems grouped by day
  const dayDataMap = useMemo(() => {
    if (!monthData) return new Map<string, { items: CalendarItem[]; summary: DaySummary }>();
    
    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, { items: CalendarItem[]; summary: DaySummary }>();
    
    for (const day of normalizedDays) {
      const items: CalendarItem[] = [];
      
      // Add planned sessions
      for (const session of day.plannedSessions) {
        items.push(sessionToCalendarItem(session, monthData.completed_activities));
      }
      
      // Add workouts that aren't already represented
      for (const workout of day.workouts) {
        if (!items.some(i => i.id === workout.id)) {
          items.push(sessionToCalendarItem(workout, monthData.completed_activities));
        }
      }
      
      // Calculate summary
      const summary: DaySummary = {
        date: day.date,
        totalDuration: items.reduce((sum, i) => sum + i.durationMin, 0),
        totalLoad: items.reduce((sum, i) => sum + (i.load || 0), 0),
        qualitySessions: items.filter(i => isQualitySession(i.intent)).length,
        items,
      };
      
      map.set(day.date, { items, summary });
    }
    
    return map;
  }, [monthData]);

  const days = useMemo(() => {
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [monthStart, monthEnd]);

  const getGroupedItemsForDay = (date: Date): GroupedCalendarItem[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = dayDataMap.get(dateStr);
    if (!dayData || dayData.items.length === 0) return [];
    return groupDuplicateSessions(dayData.items);
  };

  const getSummaryForDay = (date: Date): DaySummary | null => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dayDataMap.get(dateStr)?.summary || null;
  };

  const handleCardClick = (item: CalendarItem) => {
    // Find original session/activity data for the popup
    if (monthData && onActivityClick) {
      const session = [...monthData.planned_sessions, ...monthData.workouts]
        .find(s => s.id === item.id);
      const activity = monthData.completed_activities
        .find(a => a.id === item.id || a.planned_session_id === item.id);
      
      onActivityClick(
        session ? {
          id: session.id,
          date: session.date || '',
          sport: (normalizeCalendarSport(session.type) === 'run' ? 'running' : normalizeCalendarSport(session.type) === 'ride' ? 'cycling' : normalizeCalendarSport(session.type) === 'swim' ? 'swimming' : 'running') as 'running' | 'cycling' | 'swimming' | 'triathlon',
          intent: (normalizeCalendarIntent(session.intensity) === 'easy' ? 'aerobic' : normalizeCalendarIntent(session.intensity) === 'tempo' ? 'threshold' : normalizeCalendarIntent(session.intensity) === 'intervals' ? 'vo2' : 'aerobic') as 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery',
          title: session.title || '',
          description: '',
          duration: session.duration_minutes || 0,
          completed: session.type === 'completed' || session.status === 'completed',
        } : null,
        activity || null,
        session
      );
    }
  };

  // Show day view if a day is selected
  if (selectedDay) {
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const dayData = dayDataMap.get(dateStr);
    
    return (
      <DayView
        date={selectedDay}
        items={dayData?.items || []}
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

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const groupedItems = getGroupedItemsForDay(day);
          const summary = getSummaryForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const hasItems = groupedItems.length > 0;
          const isWeekend = idx % 7 >= 5;

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[160px] relative flex flex-col calendar-day border-b border-r border-border',
                !isCurrentMonth && 'bg-muted/20',
                isWeekend && isCurrentMonth && 'bg-muted/10',
                idx % 7 === 6 && 'border-r-0',
                'last:border-b-0',
              )}
            >
              {/* Day Header */}
              <div
                className={cn(
                  'p-2 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors',
                )}
                onClick={() => setSelectedDay(day)}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isCurrentMonth && 'text-muted-foreground/50',
                    isCurrentDay && 'bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center font-bold',
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Workout Cards */}
              <div className="flex-1 calendar-day overflow-hidden">
                <div className="calendar-card-wrapper flex-1 relative px-1 pb-1">
                  {groupedItems.length > 0 && (
                    <CalendarWorkoutStack
                      items={groupedItems[0].items}
                      variant="month"
                      onClick={handleCardClick}
                      maxVisible={3}
                    />
                  )}
                  {groupedItems.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 text-center">
                      <button
                        onClick={() => setSelectedDay(day)}
                        className="text-[10px] text-white/80 hover:text-white bg-black/20 px-2 py-0.5 rounded backdrop-blur-sm"
                      >
                        +{groupedItems.length - 1} more
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Daily Summary Footer */}
              {hasItems && summary && (
                <div className="px-2 py-1.5 border-t border-border/50 bg-muted/20">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
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
