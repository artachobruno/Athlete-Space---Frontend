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
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

interface SeasonViewProps {
  currentDate: Date;
}

export function SeasonView({ currentDate }: SeasonViewProps) {
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

  const { data: seasonData, isLoading: seasonLoading } = useQuery({
    queryKey: ['calendarSeason'],
    queryFn: () => fetchCalendarSeason(),
    retry: 1,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'season'],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
  });

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview', 90],
    queryFn: () => fetchOverview(90),
    retry: 1,
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
    
    const plannedSessions = seasonData?.sessions?.filter(s => {
      const sessionDate = s.date?.split('T')[0] || s.date;
      return sessionDate >= weekStartStr && sessionDate <= weekEndStr && s.status === 'planned';
    }) || [];

    const completedSessions = seasonData?.sessions?.filter(s => {
      const sessionDate = s.date?.split('T')[0] || s.date;
      return sessionDate >= weekStartStr && sessionDate <= weekEndStr && s.status === 'completed';
    }) || [];

    const completedActivities = (activities || []).filter(a => {
      const activityDate = a.date?.split('T')[0] || a.date;
      return activityDate >= weekStartStr && activityDate <= weekEndStr;
    });

    // Calculate CTL from overview metrics
    const ctlData = overview?.metrics?.ctl || [];
    const weekCtlData = ctlData.filter(([date]) => date >= weekStartStr && date <= weekEndStr);
    const avgCtl = weekCtlData.length > 0
      ? weekCtlData.reduce((sum, [, ctl]) => sum + ctl, 0) / weekCtlData.length
      : 0;

    // Estimate load from completed activities
    const totalLoad = completedActivities.reduce((sum, a) => sum + (a.trainingLoad || 0), 0);

    return {
      planned: plannedSessions.length,
      completed: completedSessions.length + completedActivities.length,
      totalLoad: Math.round(totalLoad),
      avgCtl: Math.round(avgCtl),
      completionRate: plannedSessions.length > 0
        ? Math.round(((completedSessions.length + completedActivities.length) / plannedSessions.length) * 100)
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

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
                <div>
                  <div className="text-xs text-muted-foreground">
                    Week {getWeek(weekStart)}
                  </div>
                  <div className="text-sm font-medium">
                    {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                  </div>
                </div>
                {isCurrentWeek && (
                  <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded">
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
