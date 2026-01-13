import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  isWithinInterval,
  getWeek,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarSeason, fetchActivities, fetchOverview } from '@/lib/api';
import { getSeasonIntelligence } from '@/lib/intelligence';
import { normalizeSportType } from '@/lib/session-utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Flag, Target, RefreshCw } from 'lucide-react';
import type { CompletedActivity } from '@/types';

interface SeasonViewProps {
  currentDate: Date;
}

export function SeasonView({ currentDate }: SeasonViewProps) {
  const { status: authStatus } = useAuth();
  
  // Get 12 weeks centered around current date
  const weeks = useMemo(() => {
    const quarterStart = new Date(currentDate);
    quarterStart.setMonth(Math.floor(currentDate.getMonth() / 3) * 3);
    quarterStart.setDate(1);
    
    const quarterEnd = new Date(quarterStart);
    quarterEnd.setMonth(quarterEnd.getMonth() + 3);
    quarterEnd.setDate(0);

    return eachWeekOfInterval(
      { start: quarterStart, end: quarterEnd },
      { weekStartsOn: 1 }
    );
  }, [currentDate]);

  // CRITICAL: Use useAuthenticatedQuery to gate behind auth and prevent race conditions
  const { data: seasonData, isLoading: seasonLoading } = useAuthenticatedQuery({
    queryKey: ['calendarSeason'],
    queryFn: () => fetchCalendarSeason(),
    retry: 1,
  });

  // Calculate how many months back we need to fetch activities for
  // We'll fetch activities for the current season plus buffer months to ensure we have historical data
  const monthsToFetch = useMemo(() => {
    const now = new Date();
    const monthsDiff = (currentDate.getFullYear() - now.getFullYear()) * 12 + (currentDate.getMonth() - now.getMonth());
    return Math.max(0, monthsDiff + 3);
  }, [currentDate]);

  // Fetch activities with pagination to cover the date range being viewed
  const activityQueryConfigs = useMemo(() => {
    const configs = [];
    // Always fetch the first page (most recent 100 activities)
    configs.push({
      queryKey: ['activities', 'limit', 100, 'offset', 0],
      queryFn: () => fetchActivities({ limit: 100, offset: 0 }),
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
      // CRITICAL: Only execute when authenticated
      enabled: authStatus === "authenticated",
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

  const activitiesLoading = activityQueryResults.some(q => q.isLoading);

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview', 90],
    queryFn: () => {
      console.log('[SeasonView] Fetching overview for 90 days');
      return fetchOverview(90);
    },
    retry: 1,
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
    // CRITICAL: Only execute when authenticated
    enabled: authStatus === "authenticated",
  });

  const { data: seasonIntelligence } = useQuery({
    queryKey: ['intelligence', 'season'],
    queryFn: () => getSeasonIntelligence(),
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - intelligence is expensive LLM call
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
    // CRITICAL: Only execute when authenticated
    enabled: authStatus === "authenticated",
  });

  const isLoading = seasonLoading || activitiesLoading || overviewLoading;
  
  // Debug logging
  if (seasonData) {
    console.log('[SeasonView] Season data received:', seasonData);
    console.log('[SeasonView] Sessions count:', seasonData.sessions?.length || 0);
  }
  if (activities) {
    console.log('[SeasonView] Activities count:', activities.length);
  }

  const getWeekStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    
    const sessionsArray = Array.isArray(seasonData?.sessions) ? seasonData.sessions : [];
    // FE-3: Remove invalid filters - show sessions that aren't explicitly excluded
    const plannedSessions = sessionsArray.filter(s => {
      if (!s || typeof s !== 'object') return false;
      // Session dates from calendar API may have time components, so format consistently
      const sessionDate = s.date ? format(new Date(s.date), 'yyyy-MM-dd') : '';
      // Show sessions that aren't completed, cancelled, or skipped (includes planned and null status)
      return sessionDate >= weekStartStr && sessionDate <= weekEndStr && s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'skipped';
    });

    const completedSessions = sessionsArray.filter(s => {
      if (!s || typeof s !== 'object') return false;
      // Session dates from calendar API may have time components, so format consistently
      const sessionDate = s.date ? format(new Date(s.date), 'yyyy-MM-dd') : '';
      return sessionDate >= weekStartStr && sessionDate <= weekEndStr && s.status === 'completed';
    });

    const activitiesArray = Array.isArray(activities) ? activities : [];
    const weekActivities = activitiesArray.filter(a => {
      if (!a || typeof a !== 'object' || !a.date) return false;
      // Date is already normalized to YYYY-MM-DD format from API
      const activityDate = a.date;
      return activityDate >= weekStartStr && activityDate <= weekEndStr;
    });

    // Create a set of completed session identifiers (date + normalized sport type) to avoid double-counting
    // If an activity has a corresponding completed session, we should only count it once
    const completedSessionKeys = new Set(
      completedSessions.map(s => {
        if (!s || !s.date || !s.type) return null;
        // Normalize session date to YYYY-MM-DD format for consistent comparison
        const sessionDate = s.date ? format(new Date(s.date), 'yyyy-MM-dd') : '';
        const normalizedSport = normalizeSportType(s.type);
        return `${sessionDate}-${normalizedSport}`;
      }).filter(Boolean) as string[]
    );

    // Filter out activities that already have a corresponding completed session
    // Match by date and normalized sport type - this ensures we don't double-count
    // activities that are already represented as completed sessions
    const uniqueCompletedActivities = weekActivities.filter(a => {
      if (!a || !a.date || !a.sport) return false;
      // Activity date is already in YYYY-MM-DD format from API
      const activityDate = a.date;
      const normalizedActivitySport = normalizeSportType(a.sport);
      const activityKey = `${activityDate}-${normalizedActivitySport}`;
      
      // Exclude activities that have a matching completed session (same date + sport)
      // This prevents double-counting: if a session is marked as completed, we count
      // the session, not the activity (unless the activity doesn't have a matching session)
      return !completedSessionKeys.has(activityKey);
    });
    
    // Additional safety: ensure we're not counting duplicate activities
    // (activities with the same ID should only be counted once)
    const seenActivityIds = new Set<string>();
    const deduplicatedUniqueActivities = uniqueCompletedActivities.filter(a => {
      if (!a || !a.id) return false;
      if (seenActivityIds.has(a.id)) return false;
      seenActivityIds.add(a.id);
      return true;
    });

    // Calculate CTL from overview metrics
    const ctlData = Array.isArray(overview?.metrics?.ctl) ? overview.metrics.ctl : [];
    const weekCtlData = ctlData.filter((item) => {
      if (!Array.isArray(item) || item.length < 1) return false;
      const [date] = item;
      return date && date >= weekStartStr && date <= weekEndStr;
    });
    const avgCtl = weekCtlData.length > 0
      ? weekCtlData.reduce((sum, [, ctl]) => sum + ctl, 0) / weekCtlData.length
      : 0;

    // Estimate load from all week activities (not just unique ones, for accurate TSS)
    // Use all activities for load calculation to get accurate total TSS
    // Only sum numeric training load values (explicitly check for number type)
    const totalLoad = weekActivities.reduce((sum, a) => {
      if (!a || typeof a !== 'object') return sum;
      return sum + (typeof a.trainingLoad === 'number' ? a.trainingLoad : 0);
    }, 0);

    // Count completed: completed sessions + unique activities (those without a corresponding session)
    // Use deduplicated activities to ensure we don't count the same activity multiple times
    const totalCompleted = completedSessions.length + deduplicatedUniqueActivities.length;

    return {
      planned: plannedSessions.length,
      completed: totalCompleted,
      totalLoad: Math.round(totalLoad),
      avgCtl: Math.round(avgCtl),
      completionRate: plannedSessions.length > 0
        ? Math.round((totalCompleted / plannedSessions.length) * 100)
        : 0,
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maxLoad = Math.max(...weeks.map(w => getWeekStats(w).totalLoad), 1);

  // Get phase and race marker for a week
  const getWeekPhase = (weekNumber: number) => {
    if (!seasonIntelligence?.phases) return null;
    return seasonIntelligence.phases.find(
      phase => weekNumber >= phase.week_start && weekNumber <= phase.week_end
    );
  };

  const getWeekRaceMarkers = (weekNumber: number) => {
    if (!seasonIntelligence?.race_markers) return [];
    return seasonIntelligence.race_markers.filter(marker => marker.week === weekNumber);
  };

  const raceMarkerIcons = {
    race: Flag,
    milestone: Target,
    recovery: RefreshCw,
  };

  const raceMarkerColors = {
    race: 'bg-red-500/20 text-red-600 border-red-500/30',
    milestone: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    recovery: 'bg-green-500/20 text-green-600 border-green-500/30',
  };

  return (
    <div className="space-y-4">
      {/* Season Intelligence Summary */}
      {seasonIntelligence && (
        <Card className="bg-accent/5 border-accent/20">
          <div className="p-4 space-y-3">
            {seasonIntelligence.explanation && (
              <p className="text-sm text-foreground leading-relaxed">
                {seasonIntelligence.explanation}
              </p>
            )}
            {seasonIntelligence.phases && seasonIntelligence.phases.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {seasonIntelligence.phases.map((phase, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {phase.label} (Weeks {phase.week_start}-{phase.week_end})
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent" />
          <span>Training Load</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-load-fresh" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Planned</span>
        </div>
        {seasonIntelligence?.race_markers && seasonIntelligence.race_markers.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              <Flag className="w-3 h-3 text-red-600" />
              <span>Race</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 text-blue-600" />
              <span>Milestone</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3 h-3 text-green-600" />
              <span>Recovery</span>
            </div>
          </>
        )}
      </div>

      {/* Weeks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weeks.map((weekStart) => {
          const stats = getWeekStats(weekStart);
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const isCurrentWeek = isWithinInterval(new Date(), {
            start: weekStart,
            end: weekEnd,
          });
          const loadPercentage = (stats.totalLoad / maxLoad) * 100;
          const weekNumber = getWeek(weekStart);
          const phase = getWeekPhase(weekNumber);
          const raceMarkers = getWeekRaceMarkers(weekNumber);

          return (
            <Card
              key={weekStart.toString()}
              className={cn(
                'p-4',
                isCurrentWeek && 'ring-2 ring-accent'
              )}
            >
              {/* Week header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-xs text-muted-foreground">
                      Week {weekNumber}
                    </div>
                    {phase && (
                      <Badge variant="outline" className="text-xs">
                        {phase.label}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm font-medium">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                  </div>
                  {raceMarkers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {raceMarkers.map((marker, idx) => {
                        const Icon = raceMarkerIcons[marker.type];
                        return (
                          <Badge
                            key={idx}
                            variant="outline"
                            className={cn('text-xs', raceMarkerColors[marker.type])}
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {marker.label}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
                {isCurrentWeek && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded shrink-0">
                    Current
                  </span>
                )}
              </div>

              {/* Load bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Load</span>
                  <span>{stats.totalLoad} TSS</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${loadPercentage}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {stats.completed}/{stats.planned}
                  </div>
                  <div className="text-xs text-muted-foreground">Workouts</div>
                </div>
                <div>
                  <div className={cn(
                    'text-lg font-semibold',
                    stats.completionRate >= 80 ? 'text-load-fresh' :
                    stats.completionRate >= 50 ? 'text-load-optimal' :
                    'text-load-overreaching'
                  )}>
                    {stats.completionRate}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {stats.avgCtl}
                  </div>
                  <div className="text-xs text-muted-foreground">CTL</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
