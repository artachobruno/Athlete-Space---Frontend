import { useMemo } from 'react';
import type { StructuredWorkoutResponse } from '@/lib/api';
import { GlassCard } from '@/components/ui/GlassCard';

interface WorkoutTimeSeriesGraphProps {
  structuredWorkout: StructuredWorkoutResponse;
}

const intensityColors: Record<string, string> = {
  warmup: 'hsl(142, 76%, 36%)', // green
  easy: 'hsl(142, 76%, 36%)',
  recovery: 'hsl(142, 76%, 36%)',
  aerobic: 'hsl(217, 91%, 60%)', // blue
  tempo: 'hsl(38, 92%, 50%)', // yellow
  threshold: 'hsl(38, 92%, 50%)',
  lt2: 'hsl(38, 92%, 50%)',
  interval: 'hsl(0, 84%, 60%)', // red
  vo2: 'hsl(0, 84%, 60%)',
  hard: 'hsl(0, 84%, 60%)',
  cooldown: 'hsl(142, 76%, 36%)',
};

function getIntensityColor(intensity: string | null): string {
  if (!intensity) return 'hsl(var(--muted-foreground))';
  const lower = intensity.toLowerCase();
  for (const [key, color] of Object.entries(intensityColors)) {
    if (lower.includes(key)) {
      return color;
    }
  }
  return 'hsl(var(--primary))';
}

export function WorkoutTimeSeriesGraph({ structuredWorkout }: WorkoutTimeSeriesGraphProps) {
  const { time_series, workout } = structuredWorkout;

  const graphData = useMemo(() => {
    if (!time_series || !time_series.time || time_series.time.length === 0) {
      return null;
    }

    const maxTime = Math.max(...time_series.time);
    const width = 600;
    const height = 200;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };

    const graphScaleX = (time: number) => {
      return ((time / maxTime) * (width - padding.left - padding.right)) + padding.left;
    };

    const graphScaleY = (value: number, maxValue: number) => {
      return height - padding.bottom - ((value / maxValue) * (height - padding.top - padding.bottom));
    };

    // Group consecutive points with same intensity for area rendering
    const segments: Array<{
      startTime: number;
      endTime: number;
      intensity: string | null;
      points: Array<{ x: number; y: number; time: number }>;
    }> = [];

    let currentSegment: typeof segments[0] | null = null;

    time_series.time.forEach((time, idx) => {
      const intensity = time_series.intensity?.[idx] ?? null;
      const distance = time_series.distance?.[idx] ?? 0;
      const maxDistance = time_series.distance ? Math.max(...time_series.distance) : 100;

      const x = graphScaleX(time);
      const y = graphScaleY(distance, maxDistance);

      if (!currentSegment || currentSegment.intensity !== intensity) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          startTime: time,
          endTime: time,
          intensity,
          points: [{ x, y, time }],
        };
      } else {
        currentSegment.endTime = time;
        currentSegment.points.push({ x, y, time });
      }
    });

    if (currentSegment) {
      segments.push(currentSegment);
    }

    return {
      segments,
      width,
      height,
      padding,
      maxTime,
      maxDistance: time_series.distance ? Math.max(...time_series.distance) : 100,
    };
  }, [time_series]);

  if (!graphData || !time_series) {
    return (
      <GlassCard>
        <CardHeader>
          <CardTitle className="text-sm">Workout Graph</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No time series data available</p>
        </CardContent>
      </GlassCard>
    );
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  };

  // Generate time ticks
  const timeTicks: number[] = [];
  const tickCount = 6;
  for (let i = 0; i <= tickCount; i++) {
    timeTicks.push((graphData.maxTime / tickCount) * i);
  }

  // Generate distance ticks
  const distanceTicks: number[] = [];
  const distanceTickCount = 5;
  for (let i = 0; i <= distanceTickCount; i++) {
    distanceTicks.push((graphData.maxDistance / distanceTickCount) * i);
  }

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-sm">Workout Graph</CardTitle>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${graphData.width} ${graphData.height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {graphData.segments.map((seg, idx) => {
              const color = getIntensityColor(seg.intensity);
              return (
                <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid lines */}
          <g stroke="hsl(var(--border))" strokeDasharray="2 2" opacity={0.3}>
            {timeTicks.slice(1, -1).map((tick, i) => {
              const x = ((tick / graphData.maxTime) * (graphData.width - graphData.padding.left - graphData.padding.right)) + graphData.padding.left;
              return <line key={`v-${i}`} x1={x} y1={graphData.padding.top} x2={x} y2={graphData.height - graphData.padding.bottom} />;
            })}
            {distanceTicks.slice(1, -1).map((tick, i) => {
              const y = graphData.height - graphData.padding.bottom - ((tick / graphData.maxDistance) * (graphData.height - graphData.padding.top - graphData.padding.bottom));
              return <line key={`h-${i}`} x1={graphData.padding.left} y1={y} x2={graphData.width - graphData.padding.right} y2={y} />;
            })}
          </g>

          {/* Y-axis (distance) */}
          <line
            x1={graphData.padding.left}
            y1={graphData.padding.top}
            x2={graphData.padding.left}
            y2={graphData.height - graphData.padding.bottom}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          {distanceTicks.map((tick, i) => {
            const y = graphData.height - graphData.padding.bottom - ((tick / graphData.maxDistance) * (graphData.height - graphData.padding.top - graphData.padding.bottom));
            return (
              <g key={`y-tick-${i}`}>
                <line
                  x1={graphData.padding.left}
                  y1={y}
                  x2={graphData.padding.left - 5}
                  y2={y}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="1"
                />
                <text
                  x={graphData.padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                >
                  {formatDistance(tick)}
                </text>
              </g>
            );
          })}

          {/* X-axis (time) */}
          <line
            x1={graphData.padding.left}
            y1={graphData.height - graphData.padding.bottom}
            x2={graphData.width - graphData.padding.right}
            y2={graphData.height - graphData.padding.bottom}
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
          />
          {timeTicks.map((tick, i) => {
            const x = ((tick / graphData.maxTime) * (graphData.width - graphData.padding.left - graphData.padding.right)) + graphData.padding.left;
            return (
              <g key={`x-tick-${i}`}>
                <line
                  x1={x}
                  y1={graphData.height - graphData.padding.bottom}
                  x2={x}
                  y2={graphData.height - graphData.padding.bottom + 5}
                  stroke="hsl(var(--foreground))"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={graphData.height - graphData.padding.bottom + 20}
                  textAnchor="middle"
                  fontSize="10"
                  fill="hsl(var(--muted-foreground))"
                >
                  {formatTime(tick)}
                </text>
              </g>
            );
          })}

          {/* Intensity segments as areas */}
          {graphData.segments.map((seg, idx) => {
            if (seg.points.length < 2) return null;
            const color = getIntensityColor(seg.intensity);
            const firstPoint = seg.points[0];
            const lastPoint = seg.points[seg.points.length - 1];
            const bottomY = graphData.height - graphData.padding.bottom;

            // Create path for area
            const pathData = [
              `M ${firstPoint.x} ${bottomY}`,
              ...seg.points.map(p => `L ${p.x} ${p.y}`),
              `L ${lastPoint.x} ${bottomY}`,
              'Z',
            ].join(' ');

            return (
              <g key={`segment-${idx}`}>
                <path
                  d={pathData}
                  fill={`url(#gradient-${idx})`}
                  opacity={0.4}
                />
                <polyline
                  points={seg.points.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  opacity={0.8}
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        {workout && workout.steps && workout.steps.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(new Set(workout.steps.map(s => s.intensity).filter(Boolean))).map((intensity) => (
              <div key={intensity} className="flex items-center gap-1.5 text-xs">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: getIntensityColor(intensity || null) }}
                />
                <span className="text-muted-foreground">{intensity}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
