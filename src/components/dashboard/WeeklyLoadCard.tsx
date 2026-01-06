import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchOverview, fetchCalendarWeek } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, startOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export function WeeklyLoadCard() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ['overview', 7],
    queryFn: () => fetchOverview(7),
    retry: 1,
  });

  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  const isLoading = overviewLoading || weekLoading;

  // Get last 7 days of training load from metrics
  const dailyLoadData = overview?.metrics.tsb ? [] : [];
  const weekChartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    return {
      day: format(date, 'EEE'),
      load: 0, // Would need daily load data from API
      isToday: i === 6,
    };
  });

  // Calculate weekly totals from calendar sessions
  const plannedLoad = weekData?.sessions?.filter(s => s.status === 'planned').length * 50 || 0;
  const actualLoad = weekData?.sessions?.filter(s => s.status === 'completed').length * 50 || 0;
  const progress = plannedLoad > 0 ? (actualLoad / plannedLoad) * 100 : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weekly Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Weekly Load</CardTitle>
          <div className="text-sm text-muted-foreground">
            {actualLoad} / {plannedLoad} TSS
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {progress.toFixed(0)}% complete
          </div>
        </div>

        {/* Daily load chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                {weekChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? 'hsl(var(--accent))' : 'hsl(var(--muted))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
