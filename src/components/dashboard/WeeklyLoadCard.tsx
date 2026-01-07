import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchOverview, fetchCalendarWeek, fetchTrainingLoad } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, startOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

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

  const { data: trainingLoadData, isLoading: trainingLoadLoading } = useQuery({
    queryKey: ['trainingLoad', 7],
    queryFn: () => fetchTrainingLoad(7),
    retry: 1,
  });

  const isLoading = overviewLoading || weekLoading || trainingLoadLoading;

  // Build chart data from training load data
  const weekChartData = useMemo(() => {
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        day: format(date, 'EEE'),
        date: dateStr,
        load: 0,
        isToday: i === 6,
      };
    });

    // Map actual daily TSS data from training load
    if (trainingLoadData?.dates && trainingLoadData?.daily_tss) {
      trainingLoadData.dates.forEach((dateStr, index) => {
        const tss = trainingLoadData.daily_tss[index];
        // Find matching day in chart data
        const chartIndex = chartData.findIndex(d => d.date === dateStr);
        if (chartIndex !== -1 && tss !== undefined && tss !== null) {
          // TSS is normalized to -100 to 100, convert to positive for display
          chartData[chartIndex].load = Math.max(0, Math.abs(tss));
        }
      });
    }

    return chartData;
  }, [trainingLoadData, today]);

  // Calculate weekly totals from actual training load data
  const weeklyStats = useMemo(() => {
    let actualLoad = 0;
    let plannedLoad = 0;

    // Calculate actual load from completed sessions or TSS data
    if (trainingLoadData?.daily_tss) {
      // Sum up TSS for the week (using absolute values)
      actualLoad = trainingLoadData.daily_tss
        .slice(-7)
        .reduce((sum, tss) => sum + Math.max(0, Math.abs(tss || 0)), 0);
    }

    // Estimate planned load from calendar sessions
    const sessions = Array.isArray(weekData?.sessions) ? weekData.sessions : [];
    const plannedSessions = sessions.filter(s => s.status === 'planned' || s.status === 'completed');
    // Estimate TSS based on session duration (rough estimate: 1 hour = ~50 TSS)
    plannedLoad = plannedSessions.reduce((sum, session) => {
      const durationHours = (session.duration_minutes || 60) / 60;
      return sum + Math.round(durationHours * 50);
    }, 0);

    // If we have actual load but no planned, use actual as baseline
    if (actualLoad > 0 && plannedLoad === 0) {
      plannedLoad = actualLoad;
    }

    const progress = plannedLoad > 0 ? (actualLoad / plannedLoad) * 100 : 0;
    return { actualLoad: Math.round(actualLoad), plannedLoad: Math.round(plannedLoad), progress };
  }, [trainingLoadData, weekData]);

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
            {weeklyStats.actualLoad} / {weeklyStats.plannedLoad} TSS
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${Math.min(weeklyStats.progress, 100)}%` }}
          />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {weeklyStats.progress.toFixed(0)}% complete
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
