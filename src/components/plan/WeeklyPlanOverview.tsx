import { Card, CardContent } from '@/components/ui/card';
import { fetchCalendarWeek } from '@/lib/api';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Target, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export function WeeklyPlanOverview() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData, isLoading } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!weekData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground text-sm">
            Unable to load weekly plan
          </div>
        </CardContent>
      </Card>
    );
  }

  const plannedSessions = weekData.sessions?.filter(s => s.status === 'planned').length || 0;
  const completedSessions = weekData.sessions?.filter(s => s.status === 'completed').length || 0;
  const plannedLoad = plannedSessions * 50; // Estimate
  const actualLoad = completedSessions * 50; // Estimate
  const progress = plannedLoad > 0 ? (actualLoad / plannedLoad) * 100 : 0;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left: Week info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Current Week</div>
              <h2 className="text-xl font-semibold text-foreground">
                {format(weekStart, 'MMM d')} – {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
              </h2>
            </div>

            {/* Weekly Focus */}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Aerobic Base Development</span>
            </div>

            {/* Load Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weekly Load</span>
                <span className="font-medium text-foreground">
                  {actualLoad} / {plannedLoad} TSS
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{progress.toFixed(0)}% complete</span>
              </div>
            </div>
          </div>

          {/* Right: Coach Note */}
          <div className="lg:w-1/2 bg-muted/50 rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Coach Notes
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {weekData.sessions?.length ? `${weekData.sessions.length} sessions planned this week` : 'No sessions planned'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
