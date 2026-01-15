import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchActivities, fetchTrainingLoad, fetchCalendarWeek } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, startOfWeek } from 'date-fns';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { enrichActivitiesWithTss } from '@/lib/tss-utils';
import type { CompletedActivity } from '@/types';

export function WeeklyLoadCard() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  // Fetch activities the same way as Calendar and Activities pages
  const { data: activities, isLoading: activitiesLoading } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - activities don't change that frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  // Fetch training load for TSS enrichment
  const { data: trainingLoadData, isLoading: trainingLoadLoading } = useAuthenticatedQuery({
    queryKey: ['trainingLoad', 7],
    queryFn: () => {
      console.log('[WeeklyLoadCard] Fetching training load for 7 days');
      return fetchTrainingLoad(7);
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors or 500 errors (fetchTrainingLoad returns empty response for 500s)
      if (error && typeof error === 'object') {
        const apiError = error as { code?: string; message?: string; status?: number };
        if (apiError.status === 500 || apiError.status === 503 ||
            apiError.code === 'ECONNABORTED' || 
            (apiError.message && apiError.message.includes('timed out'))) {
          return false;
        }
      }
      return failureCount < 1;
    },
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });

  // Fetch calendar week for planned load calculation
  const { data: weekData, isLoading: weekLoading } = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  const isLoading = activitiesLoading || trainingLoadLoading || weekLoading;

  // Enrich activities with TSS data
  const enrichedActivities = useMemo(() => {
    if (!activities) return [];
    return enrichActivitiesWithTss(activities, trainingLoadData);
  }, [activities, trainingLoadData]);

  // Build chart data for past 7 days from activities (same as Calendar and Activities)
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

    // Calculate load from activities for each day
    const activitiesArray = Array.isArray(enrichedActivities) ? enrichedActivities : [];
    chartData.forEach((dayData) => {
      // Find all activities for this day
      const dayActivities = activitiesArray.filter((activity: CompletedActivity) => {
        if (!activity || !activity.date) return false;
        const activityDate = activity.date.split('T')[0];
        return activityDate === dayData.date;
      });

      // Sum TSS from all activities for this day
      const dayLoad = dayActivities.reduce((sum, activity) => {
        const tss = activity.trainingLoad || 0;
        return sum + (typeof tss === 'number' ? tss : 0);
      }, 0);

      dayData.load = Math.round(dayLoad);
    });

    return chartData;
  }, [enrichedActivities, today]);

  // Calculate weekly totals from actual activities data
  const weeklyStats = useMemo(() => {
    let actualLoad = 0;
    let plannedLoad = 0;

    // Calculate actual load from activities for the past 7 days
    actualLoad = weekChartData.reduce((sum, day) => sum + day.load, 0);

    // Estimate planned load from calendar sessions for the week
    const sessions = Array.isArray(weekData?.sessions) ? weekData.sessions : [];
    const plannedSessions = sessions.filter(s => s?.status === 'planned' || s?.status === 'completed');
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
  }, [weekChartData, weekData]);

  if (isLoading) {
    return (
      <GlassCard>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Weekly Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
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
    </GlassCard>
  );
}
