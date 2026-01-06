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
import { mockPlannedWorkouts, mockActivities, mockTrainingLoad } from '@/lib/mock-data';
import { Card } from '@/components/ui/card';

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

  const getWeekStats = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    
    const plannedWorkouts = mockPlannedWorkouts.filter(w => {
      const workoutDate = new Date(w.date);
      return isWithinInterval(workoutDate, { start: weekStart, end: weekEnd });
    });

    const completedActivities = mockActivities.filter(a => {
      const activityDate = new Date(a.date);
      return isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
    });

    const weekLoads = mockTrainingLoad.filter(l => {
      const loadDate = new Date(l.date);
      return isWithinInterval(loadDate, { start: weekStart, end: weekEnd });
    });

    const totalLoad = weekLoads.reduce((sum, l) => sum + l.dailyLoad, 0);
    const avgCtl = weekLoads.length > 0
      ? weekLoads.reduce((sum, l) => sum + l.ctl, 0) / weekLoads.length
      : 0;

    return {
      planned: plannedWorkouts.length,
      completed: completedActivities.length,
      totalLoad: Math.round(totalLoad),
      avgCtl: Math.round(avgCtl),
      completionRate: plannedWorkouts.length > 0
        ? Math.round((completedActivities.length / plannedWorkouts.length) * 100)
        : 0,
    };
  };

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
