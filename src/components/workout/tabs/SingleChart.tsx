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
import { useUnitSystem } from '@/hooks/useUnitSystem';
import type { CompletedActivity } from '@/types';

interface SingleChartProps {
  streamsData: {
    time?: unknown[];
    pace?: unknown[];
    heartrate?: unknown[];
    elevation?: unknown[];
    power?: unknown[];
  };
  chartType: 'pace' | 'hr' | 'elevation' | 'power';
  activity: CompletedActivity;
}

// Format time in seconds to MM:SS string
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

// Calculate reasonable tick interval in seconds based on total duration
function getTickIntervalSeconds(totalSeconds: number): number {
  if (totalSeconds <= 300) return 30;
  if (totalSeconds <= 900) return 60;
  if (totalSeconds <= 1800) return 120;
  if (totalSeconds <= 3600) return 300;
  if (totalSeconds <= 7200) return 600;
  return 900;
}

// Create a custom tick formatter
function createTimeTickFormatter(data: Array<{ time: number; timeLabel: string }>) {
  if (data.length === 0) return () => '';
  
  const totalSeconds = data[data.length - 1]?.time || 0;
  const intervalSeconds = getTickIntervalSeconds(totalSeconds);
  
  const labelTimes = new Set<number>();
  for (let t = 0; t <= totalSeconds; t += intervalSeconds) {
    labelTimes.add(t);
  }
  if (totalSeconds > 0) {
    labelTimes.add(totalSeconds);
  }
  
  return (value: string) => {
    const dataPoint = data.find((d) => d.timeLabel === value);
    if (!dataPoint) return '';
    
    const timeSeconds = dataPoint.time;
    const roundedTime = Math.round(timeSeconds / intervalSeconds) * intervalSeconds;
    const tolerance = intervalSeconds * 0.1;
    if (Math.abs(timeSeconds - roundedTime) <= tolerance || labelTimes.has(timeSeconds)) {
      return formatTime(roundedTime);
    }
    return '';
  };
}

// Process stream data
function processStreamData(
  streamsData: {
    time?: unknown[];
    pace?: unknown[];
    heartrate?: unknown[];
    elevation?: unknown[];
    power?: unknown[];
  },
  chartType: 'pace' | 'hr' | 'elevation' | 'power'
) {
  if (!streamsData || !Array.isArray(streamsData.time) || streamsData.time.length === 0) {
    return [];
  }

  const timeArray = streamsData.time;
  const maxPoints = Math.min(timeArray.length, 200);
  const step = Math.max(1, Math.floor(timeArray.length / maxPoints));

  return timeArray
    .filter((_, index) => index % step === 0)
    .slice(0, maxPoints)
    .map((timeSeconds, index) => {
      const actualIndex = index * step;
      const time = Math.round(timeSeconds as number);
      const timeLabel = `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;

      let value: number | undefined;
      
      if (chartType === 'pace') {
        const paceValue = Array.isArray(streamsData.pace) ? streamsData.pace[actualIndex] : undefined;
        if (typeof paceValue === 'number' && Number.isFinite(paceValue) && paceValue > 0) {
          value = paceValue;
        }
      } else if (chartType === 'hr') {
        const hrValue = Array.isArray(streamsData.heartrate) ? streamsData.heartrate[actualIndex] : undefined;
        if (typeof hrValue === 'number' && Number.isFinite(hrValue) && hrValue > 0) {
          value = Math.round(hrValue);
        }
      } else if (chartType === 'elevation') {
        const elevValue = Array.isArray(streamsData.elevation) ? streamsData.elevation[actualIndex] : undefined;
        if (typeof elevValue === 'number' && Number.isFinite(elevValue)) {
          value = elevValue;
        }
      } else if (chartType === 'power') {
        const powerValue = Array.isArray(streamsData.power) ? streamsData.power[actualIndex] : undefined;
        if (typeof powerValue === 'number' && Number.isFinite(powerValue) && powerValue > 0) {
          value = Math.round(powerValue);
        }
      }

      return {
        time,
        timeLabel,
        value,
      };
    })
    .filter((point) => point.value !== undefined);
}

export function SingleChart({ streamsData, chartType, activity }: SingleChartProps) {
  const { convertPace, convertElevation, unitSystem } = useUnitSystem();

  const data = useMemo(() => {
    return processStreamData(streamsData, chartType);
  }, [streamsData, chartType]);

  if (data.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No data available for {chartType}
      </div>
    );
  }

  // Convert data for display
  const displayData = useMemo(() => {
    if (chartType === 'pace') {
      return data.map((point) => {
        const converted = convertPace(point.value!);
        return {
          ...point,
          displayValue: converted.value,
          unit: converted.unit,
        };
      });
    } else if (chartType === 'elevation') {
      return data.map((point) => {
        const converted = convertElevation(point.value!);
        return {
          ...point,
          displayValue: converted.value,
          unit: converted.unit,
        };
      });
    } else {
      return data.map((point) => ({
        ...point,
        displayValue: point.value!,
        unit: chartType === 'hr' ? 'bpm' : 'W',
      }));
    }
  }, [data, chartType, convertPace, convertElevation]);

  const chartConfig = {
    pace: {
      label: 'Pace',
      color: 'hsl(var(--chart-1))',
      gradientId: 'paceGradient',
      yAxisReversed: true,
      domain: ['dataMin - 0.5', 'dataMax + 0.5'],
    },
    hr: {
      label: 'Heart Rate',
      color: 'hsl(var(--chart-4))',
      gradientId: 'hrGradient',
      yAxisReversed: false,
      domain: ['dataMin - 10', 'dataMax + 10'],
    },
    elevation: {
      label: 'Elevation',
      color: 'hsl(var(--chart-2))',
      gradientId: 'elevationGradient',
      yAxisReversed: false,
      domain: ['dataMin - 10', 'dataMax + 10'],
    },
    power: {
      label: 'Power',
      color: 'hsl(var(--chart-3))',
      gradientId: 'powerGradient',
      yAxisReversed: false,
      domain: ['dataMin - 20', 'dataMax + 20'],
    },
  };

  const config = chartConfig[chartType];

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">{config.label}</span>
        <span className="text-[10px] font-mono text-muted-foreground/40">
          {displayData[0]?.unit || ''}
        </span>
      </div>
      <div className="h-64 bg-card/30 rounded border border-border/20 p-1.5">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" strokeOpacity={0.3} />
            <XAxis
              dataKey="timeLabel"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
              axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.3 }}
              tickLine={false}
              tickFormatter={createTimeTickFormatter(displayData)}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={config.domain as [string, string]}
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))', opacity: 0.5 }}
              axisLine={false}
              tickLine={false}
              width={35}
              tickFormatter={(value: number) => {
                if (chartType === 'pace') return value.toFixed(1);
                if (chartType === 'elevation') return value.toFixed(0);
                return value.toString();
              }}
              reversed={config.yAxisReversed}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '4px',
                fontSize: '10px',
                padding: '4px 8px',
              }}
              formatter={(value: number, name: string, props: { payload: { unit: string } }) => {
                const unit = props.payload.unit || '';
                const formatted = chartType === 'pace' ? value.toFixed(2) : chartType === 'elevation' ? value.toFixed(1) : value.toString();
                return [`${formatted} ${unit}`, config.label];
              }}
            />
            <Area
              type="monotone"
              dataKey="displayValue"
              stroke={config.color}
              fill={`url(#${config.gradientId})`}
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
