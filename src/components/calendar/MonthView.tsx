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
  isSameDay,
  eachWeekOfInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarWeek, fetchActivities } from '@/lib/api';
import { mapSessionToWorkout } from '@/lib/session-utils';
import { Footprints, Bike, Waves, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { useQuery, useQueries } from '@tanstack/react-query';
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

const intentColors = {
  aerobic: 'bg-training-aerobic',
  threshold: 'bg-training-threshold',
  vo2: 'bg-training-vo2',
  endurance: 'bg-training-endurance',
  recovery: 'bg-training-recovery',
};

export function MonthView({ currentDate, onActivityClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Fetch data for all weeks in the month
  const weeks = useMemo(() => {
    return eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  }, [monthStart, monthEnd]);

  const weekQueries = weeks.map(weekStart => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    return useQuery({
      queryKey: ['calendarWeek', weekStartStr],
      queryFn: () => fetchCalendarWeek(weekStartStr),
      retry: 1,
    });
  });

  // Calculate how many months back we need to fetch activities for
  // We'll fetch activities for the current month plus buffer months to ensure we have historical data
  const monthsToFetch = useMemo(() => {
    const now = new Date();
    const monthsDiff = (currentDate.getFullYear() - now.getFullYear()) * 12 + (currentDate.getMonth() - now.getMonth());
    // If viewing a month in the past, we need to fetch more activities
    // Estimate: ~30 activities per month, so we need at least (monthsDiff + 3) * 30 activities
    // But we'll fetch in batches of 100 (API limit)
    return Math.max(0, monthsDiff + 3);
  }, [currentDate]);

  // Fetch activities with pagination to cover the date range being viewed
  // We'll fetch multiple pages if needed to cover older months
  const activityQueryConfigs = useMemo(() => {
    const configs = [];
    // Always fetch the first page (most recent 100 activities)
    configs.push({
      queryKey: ['activities', 'limit', 100, 'offset', 0],
      queryFn: () => fetchActivities({ limit: 100, offset: 0 }),
    });
    
    // If we need to go back further, fetch additional pages
    // Each page is 100 activities, so we fetch pages based on how far back we need to go
    const pagesNeeded = Math.ceil(monthsToFetch / 3); // ~3 months per 100 activities
    for (let page = 1; page <= pagesNeeded && page <= 10; page++) { // Limit to 10 pages (1000 activities max)
      configs.push({
        queryKey: ['activities', 'limit', 100, 'offset', page * 100],
        queryFn: () => fetchActivities({ limit: 100, offset: page * 100 }),
      });
    }
    return configs;
  }, [monthsToFetch]);

  // Execute all activity queries using useQueries
  const activityQueryResults = useQueries({
    queries: activityQueryConfigs.map(config => ({
      ...config,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
    })),
  });

  // Combine all activity results
  const activities = useMemo(() => {
    const allActivities: CompletedActivity[] = [];
    const seenIds = new Set<string>();
    
    for (const result of activityQueryResults) {
      if (result.data && Array.isArray(result.data)) {
        for (const activity of result.data) {
          if (activity && activity.id && !seenIds.has(activity.id)) {
            seenIds.add(activity.id);
            allActivities.push(activity);
          }
        }
      }
    }
    
    // Sort by date descending (most recent first)
    return allActivities.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [activityQueryResults]);

  const activitiesLoading = activityQueryResults.some(q => q.isLoading);

  const isLoading = weekQueries.some(q => q.isLoading) || activitiesLoading;
  const allWeekData = weekQueries.map(q => q.data).filter(Boolean);
  
  // Debug logging
  if (allWeekData.length > 0) {
    const totalSessions = allWeekData.reduce((sum, w) => sum + (w?.sessions?.length || 0), 0);
    console.log('[MonthView] Total sessions across all weeks:', totalSessions);
  }
  if (activities) {
    console.log('[MonthView] Activities count:', activities.length, 'for month:', format(currentDate, 'MMMM yyyy'));
  }

  const days = useMemo(() => {
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, monthStart, monthEnd]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const allSessions = allWeekData.flatMap(w => {
      const sessions = w?.sessions;
      return Array.isArray(sessions) ? sessions : [];
    });
    
    const plannedSessions = allSessions.filter(s => {
      if (!s || typeof s !== 'object') return false;
      // Normalize date strings for comparison (handle timezone issues)
      const sessionDate = s.date?.split('T')[0] || s.date;
      return sessionDate === dateStr && s.status === 'planned';
    });
    
    const planned = plannedSessions.map(mapSessionToWorkout).filter((w): w is PlannedWorkout => w !== null);
    const activitiesArray = Array.isArray(activities) ? activities : [];
    const completed = activitiesArray.filter((a: CompletedActivity) => {
      if (!a || typeof a !== 'object') return false;
      const activityDate = a.date?.split('T')[0] || a.date;
      return activityDate === dateStr;
    });
    return { planned, completed, plannedSessions };
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
          const { planned, completed, plannedSessions } = getWorkoutsForDay(day);
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
                  const matchingActivity = completed.find(c => 
                    isSameDay(new Date(c.date), new Date(workout.date)) && 
                    c.sport === workout.sport
                  );
                  const isCompleted = !!matchingActivity;
                  const session = plannedSessions.find(s => s.id === workout.id);

                  return (
                    <div
                      key={workout.id}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs group cursor-pointer hover:ring-1 hover:ring-accent/50',
                        isCompleted
                          ? 'bg-load-fresh/20 text-load-fresh'
                          : 'bg-muted text-muted-foreground'
                      )}
                      onClick={() => onActivityClick?.(workout, matchingActivity || null, session || null)}
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
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent cursor-pointer hover:ring-1 hover:ring-accent/50"
                        onClick={() => onActivityClick?.(null, activity)}
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
