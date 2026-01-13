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
import { fetchCalendarWeek, fetchActivities, type CalendarSession } from '@/lib/api';
import { mapSessionToWorkout, normalizeSportType } from '@/lib/session-utils';
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
} as const;

/**
 * Gets the icon component for a sport type, with fallback to default icon.
 */
function getSportIcon(sport: string | null | undefined): typeof Footprints {
  const normalized = normalizeSportType(sport);
  const Icon = sportIcons[normalized];
  return Icon || Footprints; // Fallback to Footprints if somehow undefined
}

/**
 * MonthView Component
 * 
 * Displays both CalendarSession objects (planned and completed sessions) and
 * activities from the /activities endpoint. Activities are fetched and displayed
 * alongside sessions to provide a complete view of training activities.
 */
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

  // Calculate how many months back we need to fetch activities for
  // We'll fetch activities for the current month plus buffer months to ensure we have historical data
  const monthsToFetch = useMemo(() => {
    const now = new Date();
    const monthsDiff = (currentDate.getFullYear() - now.getFullYear()) * 12 + (currentDate.getMonth() - now.getMonth());
    return Math.max(0, monthsDiff + 3);
  }, [currentDate]);

  // Fetch activities with pagination to cover the date range being viewed
  const activityQueryConfigs = useMemo(() => {
    const configs = [];
    // Always fetch the first page (most recent 100 activities)
    // Use the same query key as Calendar.tsx to share cache
    configs.push({
      queryKey: ['activities', 'limit', 100],
      queryFn: () => fetchActivities({ limit: 100 }),
    });
    
    // If we need to go back further, fetch additional pages
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
    // Dates are already normalized YYYY-MM-DD strings, so we can compare directly
    return allActivities.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      // Compare YYYY-MM-DD strings directly (lexicographic comparison works for ISO dates)
      return b.date.localeCompare(a.date);
    });
  }, [activityQueryResults]);

  const isLoading = weekQueries.some(q => q.isLoading);
  const activitiesLoading = activityQueryResults.some(q => q.isLoading);
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
  
  if (activities.length > 0) {
    console.log('[MonthView] Loaded activities:', activities.length);
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
  const mapCompletedSessionToActivity = (session: CalendarSession): CompletedActivity | null => {
    // Validate session has required fields
    if (!session || !session.id || !session.date || !session.type) {
      console.warn('[MonthView] Invalid session data:', session);
      return null;
    }

    const normalizedSport = normalizeSportType(session.type);
    
    return {
      id: session.id,
      date: session.date,
      sport: normalizedSport as CompletedActivity['sport'],
      title: session.title || 'Untitled Activity',
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
    
    // FE-3: Remove invalid filters - show sessions that aren't explicitly excluded
    // Separate planned and completed sessions
    const plannedSessions = daySessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'skipped');
    const completedSessions = daySessions.filter(s => s.status === 'completed');
    
    // Map to workout/activity formats with validation
    const planned = plannedSessions
      .map(mapSessionToWorkout)
      .filter((w): w is PlannedWorkout => w !== null && w.sport !== undefined);
    
    // Get completed activities from both CalendarSession objects and activities API
    const completedFromSessions = completedSessions
      .map(mapCompletedSessionToActivity)
      .filter((a): a is CompletedActivity => a !== null && a.sport !== undefined);
    
    // Get completed activities from activities API for this day
    const activitiesArray = Array.isArray(activities) ? activities : [];
    const completedFromActivities = activitiesArray.filter((a: CompletedActivity) => {
      if (!a || typeof a !== 'object' || !a.date) return false;
      // Date is already normalized to YYYY-MM-DD format from API
      const activityDate = a.date;
      return activityDate === dateStr;
    });
    
    // Merge completed activities from both sources, avoiding duplicates
    const seenActivityIds = new Set(completedFromSessions.map(a => a.id));
    const uniqueActivitiesFromAPI = completedFromActivities.filter(a => !seenActivityIds.has(a.id));
    const completed = [...completedFromSessions, ...uniqueActivitiesFromAPI];
    
    return { planned, completed, plannedSessions, completedSessions };
  };

  if (isLoading || activitiesLoading) {
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
                  // Guard against undefined sport
                  if (!workout.sport) {
                    console.warn('[MonthView] Workout missing sport:', workout);
                    return null;
                  }

                  const Icon = getSportIcon(workout.sport);
                  
                  // Find matching completed session by sport (same day, same sport)
                  const matchingCompletedSession = completedSessions.find(s => {
                    if (!s || !s.type) return false;
                    return normalizeSportType(s.type) === normalizeSportType(workout.sport);
                  });
                  
                  // Find matching activity - first check if there's a session, then check all completed activities
                  let matchingActivity: CompletedActivity | null = null;
                  if (matchingCompletedSession) {
                    matchingActivity = completed.find(c => c.id === matchingCompletedSession.id) || null;
                  }
                  
                  // If no matching session, check if there's a matching activity from API by sport
                  if (!matchingActivity) {
                    matchingActivity = completed.find(c => 
                      normalizeSportType(c.sport) === normalizeSportType(workout.sport)
                    ) || null;
                  }
                  
                  const isCompleted = !!matchingActivity;
                  const session = plannedSessions.find(s => s.id === workout.id);
                  const completedSession = matchingCompletedSession || null;

                  return (
                    <div
                      key={workout.id || `planned-${workout.date}-${workout.title}`}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs group cursor-pointer hover:ring-1 hover:ring-accent/50',
                        isCompleted
                          ? 'bg-load-fresh/20 text-load-fresh'
                          : 'bg-muted text-muted-foreground'
                      )}
                      onClick={() => onActivityClick?.(workout, matchingActivity || null, completedSession || session || null)}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{workout.title || 'Untitled Workout'}</span>
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
                  .filter(c => {
                    // Guard against invalid activities
                    if (!c || !c.sport) {
                      console.warn('[MonthView] Invalid completed activity:', c);
                      return false;
                    }
                    return !planned.some(p => normalizeSportType(p.sport) === normalizeSportType(c.sport));
                  })
                  .map((activity) => {
                    // Double-check sport exists (should be filtered above, but extra safety)
                    if (!activity.sport) {
                      return null;
                    }

                    const Icon = getSportIcon(activity.sport);
                    const completedSession = completedSessions.find(s => s.id === activity.id) || null;
                    
                    return (
                      <div
                        key={activity.id || `completed-${activity.date}-${activity.title}`}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent cursor-pointer hover:ring-1 hover:ring-accent/50"
                        onClick={() => onActivityClick?.(null, activity, completedSession)}
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{activity.title || 'Untitled Activity'}</span>
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
