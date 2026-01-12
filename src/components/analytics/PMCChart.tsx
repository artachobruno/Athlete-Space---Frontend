import { useMemo, useState, useEffect, useCallback } from 'react';
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
  Brush,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format, parseISO, subDays } from 'date-fns';
import { RotateCcw, ZoomIn } from 'lucide-react';
import type { TrainingLoad } from '@/types';

interface PMCChartProps {
  data: TrainingLoad[];
  isAdvanced: boolean;
}

export function PMCChart({ data, isAdvanced }: PMCChartProps) {
  const chartData = useMemo(() => {
    // Ensure data is an array
    if (!Array.isArray(data)) return [];
    
    return data
      .filter((d) => d && typeof d === 'object' && d.date)
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

type DateRange = '30d' | '90d' | '180d' | '365d' | 'all';

interface VisibilityState {
  ctl: boolean;
  atl: boolean;
  tsb: boolean;
}

function sliceByRange(data: Array<TrainingLoad & { dateLabel: string }>, range: DateRange): Array<TrainingLoad & { dateLabel: string }> {
  if (range === 'all' || data.length === 0) return data;
  
  const days = range === '30d' ? 30 : range === '90d' ? 90 : range === '180d' ? 180 : 365;
  const cutoff = subDays(new Date(), days);
  const cutoffTime = cutoff.getTime();
  
  return data.filter((d) => {
    try {
      const date = parseISO(d.date);
      const dateTime = date.getTime();
      return dateTime >= cutoffTime;
    } catch {
      return true;
    }
  });
}

function AdvancedPMC({ data }: { data: Array<TrainingLoad & { dateLabel: string }> }) {
  // Load visibility state from localStorage
  const [visible, setVisible] = useState<VisibilityState>(() => {
    try {
      const saved = localStorage.getItem('pmcVisible');
      if (saved) {
        const parsed = JSON.parse(saved) as VisibilityState;
        return {
          ctl: parsed.ctl !== false,
          atl: parsed.atl !== false,
          tsb: parsed.tsb === true,
        };
      }
    } catch {
      // Ignore parse errors
    }
    return { ctl: true, atl: true, tsb: false };
  });

  // Persist visibility state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pmcVisible', JSON.stringify(visible));
    } catch {
      // Ignore storage errors
    }
  }, [visible]);

  // Reset brush when range changes
  useEffect(() => {
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
    setBrushKey((k) => k + 1);
  }, [range]);

  const [range, setRange] = useState<DateRange>('all');
  const [brushStartIndex, setBrushStartIndex] = useState<number | undefined>(undefined);
  const [brushEndIndex, setBrushEndIndex] = useState<number | undefined>(undefined);
  const [brushKey, setBrushKey] = useState(0);

  // Slice data by date range
  const rangeFilteredData = useMemo(() => {
    return sliceByRange(data, range);
  }, [data, range]);

  // Apply brush zoom to data
  const displayData = useMemo(() => {
    if (brushStartIndex === undefined || brushEndIndex === undefined) {
      return rangeFilteredData;
    }
    return rangeFilteredData.slice(brushStartIndex, brushEndIndex + 1);
  }, [rangeFilteredData, brushStartIndex, brushEndIndex]);

  // Calculate dynamic Y-axis domains based on visible series
  const leftAxisDomain = useMemo(() => {
    if (!displayData.length) return [0, 100];
    
    const values: number[] = [];
    if (visible.ctl) {
      values.push(...displayData.map((d) => d.ctl || 0));
    }
    if (visible.atl) {
      values.push(...displayData.map((d) => d.atl || 0));
    }
    
    if (values.length === 0) return [0, 100];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 10;
    
    return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
  }, [displayData, visible.ctl, visible.atl]);

  const rightAxisDomain = useMemo(() => {
    if (!visible.tsb || !displayData.length) return [-50, 50];
    
    const values = displayData.map((d) => d.tsb || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max(10, (max - min) * 0.1);
    
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [displayData, visible.tsb]);

  const handleBrushChange = useCallback((data: { startIndex?: number; endIndex?: number } | null) => {
    if (data) {
      setBrushStartIndex(data.startIndex);
      setBrushEndIndex(data.endIndex);
    } else {
      setBrushStartIndex(undefined);
      setBrushEndIndex(undefined);
    }
  }, []);

  const handleResetZoom = useCallback(() => {
    setBrushStartIndex(undefined);
    setBrushEndIndex(undefined);
    setBrushKey((k) => k + 1); // Force Brush remount to reset
  }, []);

  const toggleVisibility = useCallback((key: keyof VisibilityState) => {
    setVisible((v) => ({ ...v, [key]: !v[key] }));
  }, []);

  const hasLeftAxisSeries = visible.ctl || visible.atl;
  const hasRightAxisSeries = visible.tsb;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance Management Chart</CardTitle>
          <div className="flex items-center gap-2">
            {(brushStartIndex !== undefined || brushEndIndex !== undefined) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetZoom}
                className="h-8"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset Zoom
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Date Range Presets */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <span className="text-xs text-muted-foreground mr-2">Range:</span>
          {(['30d', '90d', '180d', '365d', 'all'] as DateRange[]).map((r) => (
            <Button
              key={r}
              variant={range === r ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setRange(r);
                handleResetZoom();
              }}
              className="h-7 text-xs"
            >
              {r === 'all' ? 'All' : r}
            </Button>
          ))}
        </div>

        {/* Interactive Legend with Checkboxes */}
        <div className="flex items-center gap-6 mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleVisibility('ctl')}>
            <Checkbox
              checked={visible.ctl}
              onCheckedChange={() => toggleVisibility('ctl')}
              className="h-4 w-4"
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-chart-1 rounded" />
              <span className="text-xs font-medium text-foreground">Fitness (CTL)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleVisibility('atl')}>
            <Checkbox
              checked={visible.atl}
              onCheckedChange={() => toggleVisibility('atl')}
              className="h-4 w-4"
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-chart-4 rounded" />
              <span className="text-xs font-medium text-foreground">Fatigue (ATL)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleVisibility('tsb')}>
            <Checkbox
              checked={visible.tsb}
              onCheckedChange={() => toggleVisibility('tsb')}
              className="h-4 w-4"
            />
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-chart-2 rounded" />
              <span className="text-xs font-medium text-foreground">Form (TSB)</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={displayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              {hasLeftAxisSeries && (
                <YAxis
                  yAxisId="left"
                  domain={leftAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={40}
                />
              )}
              {hasRightAxisSeries && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={rightAxisDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  width={40}
                  allowDecimals
                />
              )}
              <Tooltip content={<AdvancedTooltip visible={visible} />} />
              <Legend content={<CustomLegend />} />
              {hasRightAxisSeries && (
                <ReferenceLine y={0} yAxisId="right" stroke="hsl(var(--border))" strokeDasharray="3 3" />
              )}
              
              {/* TSB Area - only if visible */}
              {visible.tsb && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="tsb"
                  stroke="none"
                  fill="url(#tsbPositive)"
                  fillOpacity={1}
                />
              )}
              
              {/* CTL - Fitness */}
              {visible.ctl && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ctl"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Fitness (CTL)"
                />
              )}
              
              {/* ATL - Fatigue */}
              {visible.atl && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="atl"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Fatigue (ATL)"
                />
              )}
              
              {/* TSB - Form */}
              {visible.tsb && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tsb"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Form (TSB)"
                />
              )}

              {/* Brush for zoom */}
              <Brush
                key={brushKey}
                dataKey="dateLabel"
                height={30}
                stroke="hsl(var(--border))"
                fill="hsl(var(--muted))"
                onChange={handleBrushChange}
                startIndex={brushStartIndex}
                endIndex={brushEndIndex}
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

function AdvancedTooltip({ active, payload, label, visible }: { active?: boolean; payload?: Array<{ dataKey?: string; payload?: TrainingLoad }>; label?: string; visible: VisibilityState }) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg min-w-[140px]">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="space-y-1">
        {visible.ctl && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-chart-1">Fitness</span>
            <span className="text-xs font-medium text-foreground">{data.ctl?.toFixed(1)}</span>
          </div>
        )}
        {visible.atl && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-chart-4">Fatigue</span>
            <span className="text-xs font-medium text-foreground">{data.atl?.toFixed(1)}</span>
          </div>
        )}
        {visible.tsb && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-chart-2">Form</span>
            <span className="text-xs font-medium text-foreground">
              {data.tsb > 0 ? '+' : ''}{data.tsb?.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomLegend() {
  return null; // We use custom legend below the chart
}
