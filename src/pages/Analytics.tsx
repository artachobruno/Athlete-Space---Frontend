import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PMCChart } from '@/components/analytics/PMCChart';
import { CoachInterpretation } from '@/components/analytics/CoachInterpretation';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { fetchOverview } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { TrainingLoad } from '@/types';

export default function Analytics() {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState<30 | 90>(30);

  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['overview', dateRange],
    queryFn: () => fetchOverview(dateRange),
    retry: 1,
  });

  // Convert metrics to TrainingLoad format for components
  const filteredData = useMemo((): TrainingLoad[] => {
    if (!overview?.metrics) return [];
    
    const ctlData = overview.metrics.ctl || [];
    const atlData = overview.metrics.atl || [];
    const tsbData = overview.metrics.tsb || [];
    
    return ctlData.map(([date, ctl], index) => ({
      date,
      ctl,
      atl: atlData[index]?.[1] || 0,
      tsb: tsbData[index]?.[1] || 0,
      dailyLoad: 0, // Would need from API
    })).slice(-dateRange);
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
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
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
