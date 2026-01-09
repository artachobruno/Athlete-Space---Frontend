import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  eachWeekOfInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarWeek, type CalendarSession } from '@/lib/api';
import { mapSessionToWorkout } from '@/lib/session-utils';
import { Footprints, Bike, Waves, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import type { PlannedWorkout, CompletedActivity } from '@/types';

interface MonthViewProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: import('@/lib/api').CalendarSession | null) => void;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

export function MonthView({ currentDate, onActivityClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Fetch data for all weeks in the month
  const weeks = useMemo(() => {
    return eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  }, [monthStart, monthEnd]);

  const weekQueries = useQueries({
    queries: weeks.map(weekStart => {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      return {
        queryKey: ['calendarWeek', weekStartStr],
        queryFn: () => fetchCalendarWeek(weekStartStr),
        retry: 1,
      };
    }),
  });

  const isLoading = weekQueries.some(q => q.isLoading);
  const allWeekData = weekQueries.map(q => q.data).filter(Boolean);
  
  // Collect all sessions from all weeks
  const allSessions = useMemo(() => {
    return allWeekData.flatMap(w => {
      const sessions = w?.sessions;
      return Array.isArray(sessions) ? sessions : [];
    });
  }, [allWeekData]);
  
  // Debug logging
  if (allSessions.length > 0) {
    const totalSessions = allSessions.length;
    const plannedCount = allSessions.filter(s => s?.status === 'planned').length;
    const completedCount = allSessions.filter(s => s?.status === 'completed').length;
    console.log('[MonthView] Total sessions across all weeks:', totalSessions);
    console.log('[MonthView] Planned sessions:', plannedCount, 'Completed sessions:', completedCount);
    console.log('[MonthView] Sessions for month:', format(currentDate, 'MMMM yyyy'));
  }

  const days = useMemo(() => {
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, monthStart, monthEnd]);

  /**
   * Converts a completed CalendarSession to CompletedActivity format
   * for compatibility with existing UI components
   */
  const mapCompletedSessionToActivity = (session: CalendarSession): CompletedActivity => {
    return {
      id: session.id,
      date: session.date,
      sport: session.type as CompletedActivity['sport'],
      title: session.title,
      duration: session.duration_minutes || 0,
      distance: session.distance_km || 0,
      trainingLoad: 0, // TSS not available in CalendarSession
      source: 'manual', // Default since calendar sessions are manual entries
    };
  };

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Filter sessions for this specific day with proper timezone handling
    const daySessions = allSessions.filter(s => {
      if (!s || typeof s !== 'object' || !s.date) return false;
      
      // Normalize date strings for comparison (handle timezone issues)
      // Parse the session date and compare only the date part (YYYY-MM-DD)
      const sessionDate = new Date(s.date);
      // Ensure we're comparing local dates, not UTC
      const sessionDateStr = format(sessionDate, 'yyyy-MM-dd');
      return sessionDateStr === dateStr;
    });
    
    // Separate planned and completed sessions
    const plannedSessions = daySessions.filter(s => s.status === 'planned');
    const completedSessions = daySessions.filter(s => s.status === 'completed');
    
    // Map to workout/activity formats
    const planned = plannedSessions.map(mapSessionToWorkout).filter((w): w is PlannedWorkout => w !== null);
    const completed = completedSessions.map(mapCompletedSessionToActivity);
    
    return { planned, completed, plannedSessions, completedSessions };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const { planned, completed, plannedSessions, completedSessions } = getWorkoutsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] p-2 border-b border-r border-border',
                !isCurrentMonth && 'bg-muted/30',
                idx % 7 === 6 && 'border-r-0'
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isCurrentMonth && 'text-muted-foreground',
                    isCurrentDay &&
                      'bg-accent text-accent-foreground w-6 h-6 rounded-full flex items-center justify-center'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Workouts */}
              <div className="space-y-1">
                {planned.map((workout) => {
                  const Icon = sportIcons[workout.sport];
                  // Find matching completed session by sport (same day, same sport)
                  const matchingCompletedSession = completedSessions.find(s => 
                    s.type.toLowerCase() === workout.sport.toLowerCase()
                  );
                  const matchingActivity = matchingCompletedSession 
                    ? completed.find(c => c.id === matchingCompletedSession.id)
                    : null;
                  const isCompleted = !!matchingActivity;
                  const session = plannedSessions.find(s => s.id === workout.id);
                  const completedSession = matchingCompletedSession || null;

                  return (
                    <div
                      key={workout.id}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs group cursor-pointer hover:ring-1 hover:ring-accent/50',
                        isCompleted
                          ? 'bg-load-fresh/20 text-load-fresh'
                          : 'bg-muted text-muted-foreground'
                      )}
                      onClick={() => onActivityClick?.(workout, matchingActivity || null, completedSession || session || null)}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{workout.title}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0 ml-auto" />
                      ) : (
                        <MessageCircle className="h-3 w-3 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  );
                })}

                {/* Completed activities without a plan */}
                {completed
                  .filter(c => !planned.some(p => p.sport === c.sport))
                  .map((activity) => {
                    const Icon = sportIcons[activity.sport];
                    const completedSession = completedSessions.find(s => s.id === activity.id) || null;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent cursor-pointer hover:ring-1 hover:ring-accent/50"
                        onClick={() => onActivityClick?.(null, activity, completedSession)}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
