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

// Generate mock time-series data for the activity
function generateMockData(duration: number, avgHr?: number, avgPower?: number, elevationData?: number[]) {
  const points = Math.min(duration, 60); // Max 60 data points
  const interval = duration / points;
  
  // Use real elevation data if available, otherwise generate mock
  const hasRealElevation = elevationData && elevationData.length > 0;
  const elevationPoints = hasRealElevation ? elevationData.length : points;
  const elevationInterval = hasRealElevation ? Math.floor(elevationData.length / points) : 1;
  
  return Array.from({ length: points }, (_, i) => {
    const time = Math.round(i * interval);
    const progress = i / points;
    
    // Simulate warm-up, main effort, cool-down pattern
    let hrMultiplier = 1;
    let paceMultiplier = 1;
    
    if (progress < 0.15) {
      // Warm-up
      hrMultiplier = 0.85 + (progress / 0.15) * 0.15;
      paceMultiplier = 1.1 - (progress / 0.15) * 0.1;
    } else if (progress > 0.9) {
      // Cool-down
      hrMultiplier = 1 - ((progress - 0.9) / 0.1) * 0.1;
      paceMultiplier = 1 + ((progress - 0.9) / 0.1) * 0.1;
    }
    
    // Add some natural variation
    const variation = (Math.random() - 0.5) * 0.1;
    
    // Get elevation from real data or generate mock
    let elevation: number;
    if (hasRealElevation) {
      const elevationIndex = Math.min(i * elevationInterval, elevationData.length - 1);
      elevation = elevationData[elevationIndex] || 0;
    } else {
      elevation = 50 + Math.sin(progress * Math.PI * 4) * 30 + Math.random() * 10;
    }
    
    return {
      time,
      timeLabel: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
      heartRate: avgHr ? Math.round(avgHr * (hrMultiplier + variation)) : undefined,
      pace: 5.5 + (paceMultiplier + variation - 1) * 0.5, // min/km (will be converted for display)
      power: avgPower ? Math.round(avgPower * (hrMultiplier + variation)) : undefined,
      elevation,
    };
  });
}

export function ActivityCharts({ activity }: ActivityChartsProps) {
  const { convertPace, convertElevation, unitSystem } = useUnitSystem();
  
  // Fetch activity streams to get real elevation data
  const { data: streamsData } = useQuery({
    queryKey: ['activityStreams', activity.id],
    queryFn: () => fetchActivityStreams(activity.id),
    retry: 1,
    enabled: !!activity.id,
  });
  
  // Extract elevation data from streams
  const elevationData = useMemo(() => {
    const altitude = streamsData?.streams_data?.altitude;
    if (altitude && Array.isArray(altitude) && altitude.length > 0) {
      return altitude;
    }
    return undefined;
  }, [streamsData]);
  
  const data = useMemo(
    () => generateMockData(activity.duration, activity.avgHeartRate, activity.avgPower, elevationData),
    [activity, elevationData]
  );

  const hasHeartRate = activity.avgHeartRate !== undefined;
  const hasPower = activity.avgPower !== undefined;
  
  // Convert pace data for display
  const paceData = useMemo(() => {
    return data.map((point) => {
      const converted = convertPace(point.pace);
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

      {/* Elevation Chart */}
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
    </div>
  );
}
