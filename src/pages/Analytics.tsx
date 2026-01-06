import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PMCChart } from '@/components/analytics/PMCChart';
import { CoachInterpretation } from '@/components/analytics/CoachInterpretation';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { mockTrainingLoad } from '@/lib/mock-data';

export default function Analytics() {
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [dateRange, setDateRange] = useState<30 | 90>(30);

  // Filter data based on date range
  const filteredData = mockTrainingLoad.slice(-dateRange);

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
