import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import type { CompletedActivity } from '@/types';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams } from '@/lib/api';

interface ActivityChartsProps {
  activity: CompletedActivity;
}

// Process real stream data from backend API only
function processStreamData(
  streamsData: { time?: number[]; route_points?: number[][]; elevation?: number[]; pace?: (number | null)[]; heartrate?: number[]; power?: number[]; cadence?: number[] } | undefined
) {
  // Only process if we have time stream data from backend
  if (!streamsData?.time || streamsData.time.length === 0) {
    return [];
  }
  
  const timeArray = streamsData.time;
  const maxPoints = Math.min(timeArray.length, 200); // Limit to 200 points for performance
  const step = Math.max(1, Math.floor(timeArray.length / maxPoints));
  
  const hasHeartRate = streamsData.heartrate && streamsData.heartrate.length > 0;
  const hasPace = streamsData.pace && streamsData.pace.length > 0;
  const hasPower = streamsData.power && streamsData.power.length > 0;
  const hasElevation = streamsData.elevation && streamsData.elevation.length > 0;
  const hasCadence = streamsData.cadence && streamsData.cadence.length > 0;
  
  return timeArray
    .filter((_, index) => index % step === 0)
    .slice(0, maxPoints)
    .map((timeSeconds, index) => {
      const actualIndex = index * step;
      const time = Math.round(timeSeconds);
      const timeLabel = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
      
      // Get heart rate from real stream data only
      const heartRate = hasHeartRate && streamsData.heartrate
        ? (streamsData.heartrate[actualIndex] !== null && streamsData.heartrate[actualIndex] !== undefined
            ? Math.round(streamsData.heartrate[actualIndex])
            : undefined)
        : undefined;
      
      // Get pace from real stream data (already in min/km, null when stopped)
      let pace: number | undefined;
      if (hasPace && streamsData.pace) {
        const paceValue = streamsData.pace[actualIndex];
        if (paceValue !== null && paceValue !== undefined && paceValue > 0) {
          pace = paceValue;
        }
      }
      
      // Get power from real stream data only
      const power = hasPower && streamsData.power
        ? (streamsData.power[actualIndex] !== null && streamsData.power[actualIndex] !== undefined
            ? Math.round(streamsData.power[actualIndex])
            : undefined)
        : undefined;
      
      // Get elevation from real stream data only
      const elevation = hasElevation && streamsData.elevation
        ? (streamsData.elevation[actualIndex] !== null && streamsData.elevation[actualIndex] !== undefined
            ? streamsData.elevation[actualIndex]
            : 0)
        : 0;
      
      // Get cadence from real stream data only
      const cadence = hasCadence && streamsData.cadence
        ? (streamsData.cadence[actualIndex] !== null && streamsData.cadence[actualIndex] !== undefined
            ? Math.round(streamsData.cadence[actualIndex])
            : undefined)
        : undefined;
      
      return {
        time,
        timeLabel,
        heartRate,
        pace: pace || undefined,
        power,
        elevation,
        cadence,
      };
    });
}

export function ActivityCharts({ activity }: ActivityChartsProps) {
  const { convertPace, convertElevation, unitSystem } = useUnitSystem();
  
  // Fetch activity streams to get real time-series data
  const { data: streamsData, isLoading: isLoadingStreams, error: streamsError } = useQuery({
    queryKey: ['activityStreams', activity.id],
    queryFn: () => fetchActivityStreams(activity.id),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
    enabled: !!activity.id,
  });
  
  // Process stream data - only use real backend API data
  const data = useMemo(
    () => processStreamData(streamsData),
    [streamsData]
  );
  
  // Check if we have real data from streams
  const hasData = data.length > 0;
  
  // Check which metrics we have from real stream data
  const hasHeartRate = useMemo(() => {
    return data.some((point) => point.heartRate !== undefined && point.heartRate > 0);
  }, [data]);
  
  const hasPaceData = useMemo(() => {
    return data.some((point) => point.pace !== undefined && point.pace > 0);
  }, [data]);
  
  const hasPower = useMemo(() => {
    return data.some((point) => point.power !== undefined && point.power > 0);
  }, [data]);
  
  const hasElevation = useMemo(() => {
    return data.some((point) => point.elevation !== undefined && point.elevation !== 0);
  }, [data]);
  
  const hasCadence = useMemo(() => {
    return data.some((point) => point.cadence !== undefined && point.cadence > 0);
  }, [data]);
  
  // Convert pace data for display
  const paceData = useMemo(() => {
    return data
      .filter((point) => point.pace !== undefined && point.pace > 0) // Filter out invalid pace values
      .map((point) => {
        const converted = convertPace(point.pace!);
        return {
          ...point,
          paceDisplay: converted.value,
          paceUnit: converted.unit,
        };
      });
  }, [data, convertPace]);
  
  // Convert elevation data for display
  const elevationDataDisplay = useMemo(() => {
    return data.map((point) => {
      const converted = convertElevation(point.elevation);
      return {
        ...point,
        elevationDisplay: converted.value,
        elevationUnit: converted.unit,
      };
    });
  }, [data, convertElevation]);

  // Show loading state while fetching streams
  if (isLoadingStreams) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading activity data...</p>
      </div>
    );
  }

  if (!hasData) {
    const errorMessage = streamsError instanceof Error ? streamsError.message : '';
    const isFetchError = errorMessage.includes('not available') || errorMessage.includes('404');
    
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No stream data available for this activity</p>
        {isFetchError ? (
          <p className="text-xs mt-2">
            Stream data could not be fetched from Strava. This may be due to API limitations or the activity type.
          </p>
        ) : (
          <p className="text-xs mt-2">Stream data may not be available for this activity</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Heart Rate Chart */}
      {hasHeartRate && (
        <div>
          <h5 className="text-sm font-medium text-foreground mb-3">Heart Rate</h5>
          <div className="h-48 bg-muted/30 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} bpm`, 'Heart Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="heartRate"
                  stroke="hsl(var(--chart-4))"
                  fill="url(#hrGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pace Chart */}
      {hasPaceData && (
        <div>
          <h5 className="text-sm font-medium text-foreground mb-3">Pace</h5>
          <div className="h-48 bg-muted/30 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paceData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="paceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(value) => value.toFixed(1)}
                  reversed
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: { payload: { paceUnit: string } }) => {
                    const unit = props.payload.paceUnit || (unitSystem === 'imperial' ? 'min/mi' : 'min/km');
                    return [`${value.toFixed(2)} ${unit}`, 'Pace'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="paceDisplay"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#paceGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Power Chart */}
      {hasPower && (
        <div>
          <h5 className="text-sm font-medium text-foreground mb-3">Power</h5>
          <div className="h-48 bg-muted/30 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 20', 'dataMax + 20']}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} W`, 'Power']}
                />
                <Area
                  type="monotone"
                  dataKey="power"
                  stroke="hsl(var(--chart-3))"
                  fill="url(#powerGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Cadence Chart */}
      {hasCadence && (
        <div>
          <h5 className="text-sm font-medium text-foreground mb-3">Cadence</h5>
          <div className="h-48 bg-muted/30 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="cadenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value} rpm`, 'Cadence']}
                />
                <Area
                  type="monotone"
                  dataKey="cadence"
                  stroke="hsl(var(--chart-5))"
                  fill="url(#cadenceGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Elevation Chart */}
      {hasElevation && (
        <div>
          <h5 className="text-sm font-medium text-foreground mb-3">Elevation</h5>
          <div className="h-48 bg-muted/30 rounded-lg p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={elevationDataDisplay} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="timeLabel"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 10', 'dataMax + 10']}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(value: number) => {
                    return `${value.toFixed(0)}`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string, props: { payload: { elevationUnit: string } }) => {
                    const unit = props.payload.elevationUnit || (unitSystem === 'imperial' ? 'ft' : 'm');
                    return [`${value.toFixed(1)} ${unit}`, 'Elevation'];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="elevationDisplay"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#elevationGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
