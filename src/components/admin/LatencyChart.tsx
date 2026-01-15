import { GlassCard } from '@/components/ui/GlassCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LatencyDataPoint {
  time: string;
  p50: number;
  p95: number;
  p99: number;
}

interface LatencyChartProps {
  data: LatencyDataPoint[];
  currentMetrics: {
    p50: number;
    p95: number;
    p99: number;
  };
}

/**
 * Latency chart showing p50, p95, p99 over time
 * Used in admin dashboard for API performance monitoring
 */
export function LatencyChart({ data, currentMetrics }: LatencyChartProps) {
  return (
    <GlassCard>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">API Latency</CardTitle>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">p50: {currentMetrics.p50}ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">p95: {currentMetrics.p95}ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">p99: {currentMetrics.p99}ms</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Last 24 hours</p>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}ms`}
                className="text-muted-foreground"
                width={50}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number, name: string) => [`${value}ms`, name.toUpperCase()]}
              />
              <Line 
                type="monotone" 
                dataKey="p50" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={false}
                name="p50"
              />
              <Line 
                type="monotone" 
                dataKey="p95" 
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                name="p95"
              />
              <Line 
                type="monotone" 
                dataKey="p99" 
                stroke="#ef4444" 
                strokeWidth={2}
                dot={false}
                name="p99"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </GlassCard>
  );
}
