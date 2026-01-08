import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PMCChart } from '@/components/analytics/PMCChart';
import { CoachInterpretation } from '@/components/analytics/CoachInterpretation';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { fetchOverview } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import type { TrainingLoad } from '@/types';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';

export default function Analytics() {
  useSyncTodayWorkout();
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState<30 | 90>(30);

  const { data: overview, isLoading, error } = useAuthenticatedQuery({
    queryKey: ['overview', dateRange],
    queryFn: () => {
      console.log('[Analytics] Fetching overview for', dateRange, 'days');
      return fetchOverview(dateRange);
    },
    retry: 1,
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });

  // Convert metrics to TrainingLoad format for components
  const filteredData = useMemo((): TrainingLoad[] => {
    if (!overview?.metrics) {
      console.log('[Analytics] No overview metrics available');
      return [];
    }
    
    const ctlData = Array.isArray(overview.metrics.ctl) ? overview.metrics.ctl : [];
    const atlData = Array.isArray(overview.metrics.atl) ? overview.metrics.atl : [];
    const tsbData = Array.isArray(overview.metrics.tsb) ? overview.metrics.tsb : [];
    
    console.debug('[Analytics] Metrics received:', {
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
          <p>Unable to load analytics data</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            {isAdvanced ? 'Performance Management Chart' : 'Your training trends'}
          </p>
        </div>

        {/* Controls */}
        <AnalyticsHeader
          isAdvanced={isAdvanced}
          onToggleAdvanced={setIsAdvanced}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        {/* Coach Interpretation */}
        <CoachInterpretation data={filteredData} isAdvanced={isAdvanced} />

        {/* PMC Chart */}
        <PMCChart data={filteredData} isAdvanced={isAdvanced} />
      </div>
    </AppLayout>
  );
}
