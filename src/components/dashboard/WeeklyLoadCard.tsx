import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { fetchActivities, fetchTrainingLoad, fetchCalendarWeek } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format, startOfWeek } from 'date-fns';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import { enrichActivitiesWithTss, type TrainingLoadData } from '@/lib/tss-utils';
import type { CompletedActivity } from '@/types';
import type { WeekResponse } from '@/lib/api';

interface WeeklyLoadCardProps {
  activities100?: CompletedActivity[] | null;
  activities100Loading?: boolean;
  trainingLoad7d?: TrainingLoadData | null;
  trainingLoad7dLoading?: boolean;
  weekData?: WeekResponse | null;
  weekDataLoading?: boolean;
}

export function WeeklyLoadCard(props?: WeeklyLoadCardProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  // Use props if provided, otherwise fetch (backward compatibility)
  const propsActivities100 = props?.activities100;
  const propsActivities100Loading = props?.activities100Loading;
  const propsTrainingLoad7d = props?.trainingLoad7d;
  const propsTrainingLoad7dLoading = props?.trainingLoad7dLoading;
  const propsWeekData = props?.weekData;
  const propsWeekDataLoading = props?.weekDataLoading;

  // Fetch activities the same way as Calendar and Activities pages
  const { data: activities, isLoading: activitiesLoading } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    enabled: propsActivities100 === undefined, // Only fetch if props not provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch training load for TSS enrichment
  const { data: trainingLoadData, isLoading: trainingLoadLoading } = useAuthenticatedQuery<TrainingLoadData>({
    queryKey: ['trainingLoad', 7],
    queryFn: () => {
      console.log('[WeeklyLoadCard] Fetching training load for 7 days');
      return fetchTrainingLoad(7);
    },
    retry: (failureCount, error) => {
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
    enabled: propsTrainingLoad7d === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch calendar week for planned load calculation
  const { data: weekData, isLoading: weekLoading } = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
    enabled: propsWeekData === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Use props if provided, otherwise use fetched data
  const finalActivities = propsActivities100 !== undefined ? propsActivities100 : activities;
  const finalTrainingLoadData = propsTrainingLoad7d !== undefined ? propsTrainingLoad7d : trainingLoadData;
  const finalWeekData = propsWeekData !== undefined ? propsWeekData : weekData;
  
  const isLoading = (propsActivities100Loading !== undefined ? propsActivities100Loading : activitiesLoading) ||
                    (propsTrainingLoad7dLoading !== undefined ? propsTrainingLoad7dLoading : trainingLoadLoading) ||
                    (propsWeekDataLoading !== undefined ? propsWeekDataLoading : weekLoading);

  // Enrich activities with TSS data
  const enrichedActivities = useMemo(() => {
    if (!finalActivities) return [];
    return enrichActivitiesWithTss(finalActivities, finalTrainingLoadData);
  }, [finalActivities, finalTrainingLoadData]);

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
    const sessions = Array.isArray(finalWeekData?.sessions) ? finalWeekData.sessions : [];
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
  }, [weekChartData, finalWeekData]);

  if (isLoading) {
    return (
      <F1Card>
        <F1CardHeader>
          <F1CardTitle>LOAD (7d)</F1CardTitle>
        </F1CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--f1-text-tertiary))]" />
        </div>
      </F1Card>
    );
  }

  return (
    <F1Card>
      <F1CardHeader
        action={
          <span className="f1-metric f1-metric-sm">
            {weeklyStats.actualLoad} <span className="text-[hsl(var(--f1-text-muted))]">/</span> {weeklyStats.plannedLoad} <F1CardLabel className="ml-1">TSS</F1CardLabel>
          </span>
        }
      >
        <F1CardTitle>LOAD (7d)</F1CardTitle>
      </F1CardHeader>
      
      <div className="space-y-4">
        {/* Progress bar - F1 telemetry style */}
        <div className="space-y-2">
          <div className="h-1.5 bg-[var(--border-subtle)] rounded-f1-sm overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--accent-telemetry))] transition-all duration-300"
              style={{ width: `${Math.min(weeklyStats.progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <F1CardLabel>ADHERENCE</F1CardLabel>
            <span className="f1-metric f1-metric-xs">{weeklyStats.progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* Daily load chart - F1 instrument panel style */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--f1-text-tertiary))', fontFamily: 'JetBrains Mono, monospace' }}
              />
              <YAxis hide />
              <Bar dataKey="load" radius={[2, 2, 0, 0]}>
                {weekChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? 'hsl(var(--accent-telemetry))' : 'hsl(215 20% 25%)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </F1Card>
  );
}
