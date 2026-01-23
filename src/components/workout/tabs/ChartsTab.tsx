import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams } from '@/lib/api';
import type { CompletedActivity } from '@/types';
import { SingleChart } from './SingleChart';

interface ChartsTabProps {
  activity?: CompletedActivity | null;
}

type ChartType = 'pace' | 'hr' | 'elevation' | 'power';

export function ChartsTab({ activity }: ChartsTabProps) {
  const [chartType, setChartType] = useState<ChartType>(() => {
    // Default: Run → Pace, Ride → Power
    if (!activity) return 'pace';
    const sport = activity.sport?.toLowerCase() || '';
    return sport === 'cycling' || sport === 'ride' ? 'power' : 'pace';
  });

  // Fetch activity streams
  const { data: streamsData, isLoading, error } = useQuery({
    queryKey: ['activityStreams', activity?.id],
    queryFn: () => fetchActivityStreams(activity!.id),
    retry: false,
    enabled: !!activity?.id,
  });

  // Process stream data to check availability
  const availableCharts = useMemo(() => {
    if (!streamsData || !Array.isArray(streamsData.time) || streamsData.time.length === 0) {
      return { pace: false, hr: false, elevation: false, power: false };
    }

    const hasPace = Array.isArray(streamsData.pace) && streamsData.pace.some((p: unknown) => typeof p === 'number' && p > 0);
    const hasHr = Array.isArray(streamsData.heartrate) && streamsData.heartrate.some((h: unknown) => typeof h === 'number' && h > 0);
    const hasElevation = Array.isArray(streamsData.elevation) && streamsData.elevation.some((e: unknown) => typeof e === 'number');
    const hasPower = Array.isArray(streamsData.power) && streamsData.power.some((p: unknown) => typeof p === 'number' && p > 0);

    return { pace: hasPace, hr: hasHr, elevation: hasElevation, power: hasPower };
  }, [streamsData]);

  if (!activity) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No activity data available
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        Loading chart data...
      </div>
    );
  }

  if (error || !streamsData) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No stream data available
      </div>
    );
  }

  // Ensure selected chart is available, fallback to first available
  const activeChartType = availableCharts[chartType] 
    ? chartType 
    : (availableCharts.pace ? 'pace' : availableCharts.hr ? 'hr' : availableCharts.elevation ? 'elevation' : availableCharts.power ? 'power' : null);

  if (!activeChartType) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No chart data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart type selector */}
      <div className="flex gap-2 flex-wrap">
        {availableCharts.pace && (
          <Button
            variant={activeChartType === 'pace' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('pace')}
            className="text-xs"
          >
            Pace
          </Button>
        )}
        {availableCharts.hr && (
          <Button
            variant={activeChartType === 'hr' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('hr')}
            className="text-xs"
          >
            Heart Rate
          </Button>
        )}
        {availableCharts.elevation && (
          <Button
            variant={activeChartType === 'elevation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('elevation')}
            className="text-xs"
          >
            Elevation
          </Button>
        )}
        {availableCharts.power && (
          <Button
            variant={activeChartType === 'power' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setChartType('power')}
            className="text-xs"
          >
            Power
          </Button>
        )}
      </div>

      {/* Single chart display */}
      <SingleChart 
        streamsData={streamsData} 
        chartType={activeChartType}
        activity={activity}
      />
    </div>
  );
}
