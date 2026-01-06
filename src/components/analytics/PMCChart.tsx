import { useMemo, useState } from 'react';
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
  ComposedChart,
  ReferenceLine,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import type { TrainingLoad } from '@/types';

interface PMCChartProps {
  data: TrainingLoad[];
  isAdvanced: boolean;
}

export function PMCChart({ data, isAdvanced }: PMCChartProps) {
  const chartData = useMemo(() => {
    return data
      .filter((d) => d && d.date)
      .map((d) => {
        const dateLabel = d.date ? (() => {
          try {
            return format(parseISO(d.date), 'MMM d');
          } catch {
            return d.date;
          }
        })() : 'Unknown';
        
        return {
          ...d,
          dateLabel,
          // For simple view, create a combined "fitness score"
          fitnessScore: (d.ctl || 0) - Math.abs(d.tsb || 0) * 0.3,
        };
      });
  }, [data]);

  if (isAdvanced) {
    return <AdvancedPMC data={chartData} />;
  }

  return <SimplePMC data={chartData} />;
}

function SimplePMC({ data }: { data: Array<TrainingLoad & { dateLabel: string; fitnessScore: number }> }) {
  const latestScore = data[data.length - 1]?.fitnessScore || 0;
  const trend = data.length > 7 
    ? latestScore - (data[data.length - 7]?.fitnessScore || 0) 
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Fitness Trend</CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {latestScore.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">
              {trend >= 0 ? '+' : ''}{trend.toFixed(1)} this week
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fitnessGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip content={<SimpleTooltip />} />
              <Area
                type="monotone"
                dataKey="fitnessScore"
                stroke="hsl(var(--accent))"
                fill="url(#fitnessGradient)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--accent))' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Your overall fitness trend based on training consistency and recovery
        </p>
      </CardContent>
    </Card>
  );
}

function AdvancedPMC({ data }: { data: Array<TrainingLoad & { dateLabel: string }> }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Performance Management Chart</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="tsbPositive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--load-fresh))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--load-fresh))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tsbNegative" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="5%" stopColor="hsl(var(--load-overreaching))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--load-overreaching))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="dateLabel"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={40}
              />
              <Tooltip content={<AdvancedTooltip />} />
              <Legend content={<CustomLegend />} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              
              {/* TSB Area */}
              <Area
                type="monotone"
                dataKey="tsb"
                stroke="none"
                fill="url(#tsbPositive)"
                fillOpacity={1}
              />
              
              {/* CTL - Fitness */}
              <Line
                type="monotone"
                dataKey="ctl"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="Fitness (CTL)"
              />
              
              {/* ATL - Fatigue */}
              <Line
                type="monotone"
                dataKey="atl"
                stroke="hsl(var(--chart-4))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="Fatigue (ATL)"
              />
              
              {/* TSB - Form */}
              <Line
                type="monotone"
                dataKey="tsb"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
                name="Form (TSB)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend explanation */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-0.5 bg-chart-1 rounded" />
              <span className="text-xs font-medium text-foreground">Fitness (CTL)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Long-term training adaptation
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-0.5 bg-chart-4 rounded" />
              <span className="text-xs font-medium text-foreground">Fatigue (ATL)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Short-term training stress
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-0.5 bg-chart-2 rounded" />
              <span className="text-xs font-medium text-foreground">Form (TSB)</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Balance of fitness and fatigue
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SimpleTooltip({ active, payload, label }: any) {
  if (!active || !payload?.[0]) return null;

  const value = payload[0].value;

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm font-semibold text-foreground">
        Fitness: {value.toFixed(0)}
      </div>
    </div>
  );
}

function AdvancedTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg min-w-[140px]">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-chart-1">Fitness</span>
          <span className="text-xs font-medium text-foreground">{data?.ctl?.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-chart-4">Fatigue</span>
          <span className="text-xs font-medium text-foreground">{data?.atl?.toFixed(1)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-chart-2">Form</span>
          <span className="text-xs font-medium text-foreground">
            {data?.tsb > 0 ? '+' : ''}{data?.tsb?.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CustomLegend() {
  return null; // We use custom legend below the chart
}
