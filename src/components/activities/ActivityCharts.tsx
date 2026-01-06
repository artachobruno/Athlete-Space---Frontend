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

interface ActivityChartsProps {
  activity: CompletedActivity;
}

// Generate mock time-series data for the activity
function generateMockData(duration: number, avgHr?: number, avgPower?: number) {
  const points = Math.min(duration, 60); // Max 60 data points
  const interval = duration / points;
  
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
    
    return {
      time,
      timeLabel: `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`,
      heartRate: avgHr ? Math.round(avgHr * (hrMultiplier + variation)) : undefined,
      pace: 5.5 + (paceMultiplier + variation - 1) * 0.5, // min/km
      power: avgPower ? Math.round(avgPower * (hrMultiplier + variation)) : undefined,
      elevation: 50 + Math.sin(progress * Math.PI * 4) * 30 + Math.random() * 10,
    };
  });
}

export function ActivityCharts({ activity }: ActivityChartsProps) {
  const data = useMemo(
    () => generateMockData(activity.duration, activity.avgHeartRate, activity.avgPower),
    [activity]
  );

  const hasHeartRate = activity.avgHeartRate !== undefined;
  const hasPower = activity.avgPower !== undefined;

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
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
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
                formatter={(value: number) => [`${value.toFixed(2)} min/km`, 'Pace']}
              />
              <Area
                type="monotone"
                dataKey="pace"
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
        <div className="h-32 bg-muted/30 rounded-lg p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="elevationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis dataKey="timeLabel" hide />
              <YAxis hide />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="hsl(var(--chart-2))"
                fill="url(#elevationGradient)"
                strokeWidth={1}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
