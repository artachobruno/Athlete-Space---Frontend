import { AppLayout } from '@/components/layout/AppLayout';
import { TrainingCalendar } from '@/components/calendar/TrainingCalendar';
import { TelemetryMetricsStrip } from '@/components/dashboard/TelemetryMetricsStrip';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { useAutoMatchSessions } from '@/hooks/useAutoMatchSessions';
import { fetchOverview } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

export default function Calendar() {
  useSyncTodayWorkout();
  
  // Auto-match activities to planned sessions
  useAutoMatchSessions(true);

  // Fetch overview data for metrics strip
  const { data: overview60d, isLoading: overview60dLoading } = useAuthenticatedQuery({
    queryKey: ['overview', 60],
    queryFn: () => fetchOverview(60),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-primary">Calendar</h1>
          <p className="text-muted-foreground mt-1">Your training schedule</p>
        </div>

        {/* Metrics Strip - same as Dashboard */}
        <TelemetryMetricsStrip
          overview60d={overview60d}
          isLoading={overview60dLoading}
        />

        {/* Calendar */}
        <TrainingCalendar />
      </div>
    </AppLayout>
  );
}
