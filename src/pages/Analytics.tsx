import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PMCChart } from '@/components/analytics/PMCChart';
import { CoachInterpretation } from '@/components/analytics/CoachInterpretation';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { TelemetryMetricsStrip } from '@/components/dashboard/TelemetryMetricsStrip';
import { ComplianceDashboard } from '@/components/calendar/ComplianceDashboard';
import { fetchOverview } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import type { TrainingLoad } from '@/types';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { PlanCoachChat } from '@/components/plan/PlanCoachChat';

export default function Analytics() {
  useSyncTodayWorkout();
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState<30 | 90>(30);

  // Fetch overview for date range (used by PMC chart)
  const { data: overview, isLoading, error } = useAuthenticatedQuery({
    queryKey: ['overview', dateRange],
    queryFn: () => {
      console.log('[Insights] Fetching overview for', dateRange, 'days');
      return fetchOverview(dateRange);
    },
    retry: 1,
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });

  // Fetch 60-day overview for TelemetryMetricsStrip (consistent with previous dashboard)
  const { data: overview60d, isLoading: overview60dLoading } = useAuthenticatedQuery({
    queryKey: ['overview', 60],
    queryFn: () => fetchOverview(60),
    retry: 1,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Convert metrics to TrainingLoad format for components
  const filteredData = useMemo((): TrainingLoad[] => {
    if (!overview?.metrics) {
      console.log('[Insights] No overview metrics available');
      return [];
    }
    
    const ctlData = Array.isArray(overview.metrics.ctl) ? overview.metrics.ctl : [];
    const atlData = Array.isArray(overview.metrics.atl) ? overview.metrics.atl : [];
    const tsbData = Array.isArray(overview.metrics.tsb) ? overview.metrics.tsb : [];
    
    console.debug('[Insights] Metrics received:', {
      ctlCount: ctlData.length,
      atlCount: atlData.length,
      tsbCount: tsbData.length,
      sampleCtl: ctlData[0],
      sampleAtl: atlData[0],
      sampleTsb: tsbData[0],
    });
    
    if (ctlData.length === 0) return [];
    
    return ctlData.map((item, index) => {
      // Ensure item is an array with at least 2 elements [date, value]
      if (!Array.isArray(item) || item.length < 2) {
        return {
          date: '',
          ctl: 0,
          atl: 0,
          tsb: 0,
          dailyLoad: 0,
        };
      }
      const [date, ctl] = item;
      return {
        date: typeof date === 'string' ? date : '',
        ctl: typeof ctl === 'number' ? ctl : 0,
        atl: (Array.isArray(atlData[index]) && typeof atlData[index][1] === 'number') ? atlData[index][1] : 0,
        tsb: (Array.isArray(tsbData[index]) && typeof tsbData[index][1] === 'number') ? tsbData[index][1] : 0,
        dailyLoad: 0, // Would need from API
      };
    }).filter(item => item.date !== '').slice(-dateRange);
  }, [overview, dateRange]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (error || !overview) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load insights data</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Insights</h1>
          <p className="text-muted-foreground mt-1">
            {isAdvanced ? 'Performance Management Chart' : 'Your training progress'}
          </p>
        </div>

        {/* Training Status Strip - CTL/ATL/TSB */}
        <TelemetryMetricsStrip
          overview60d={overview60d}
          isLoading={overview60dLoading}
        />

        {/* Coach Interpretation - AI summary of current status */}
        <CoachInterpretation data={filteredData} isAdvanced={isAdvanced} />

        {/* Compliance Dashboard - Weekly & Season */}
        <ComplianceDashboard showWeekly={true} showSeason={true} />

        {/* Controls for PMC Chart */}
        <AnalyticsHeader
          isAdvanced={isAdvanced}
          onToggleAdvanced={setIsAdvanced}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* PMC Chart - Detailed trends */}
        <PMCChart data={filteredData} isAdvanced={isAdvanced} />

        {/* Floating Coach Chat */}
        <PlanCoachChat />
      </div>
    </AppLayout>
  );
}
