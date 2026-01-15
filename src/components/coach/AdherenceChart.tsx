import { GlassCard } from '@/components/ui/GlassCard';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface AdherenceChartProps {
  data: number[];
}

/**
 * Adherence trend chart for Coach Dashboard
 * Shows daily adherence % over the last 14 days
 * Highlights dips below 60%
 */
export function AdherenceChart({ data }: AdherenceChartProps) {
  // Transform array to chart data format
  const chartData = data.map((value, index) => ({
    day: `Day ${index + 1}`,
    adherence: value,
    belowThreshold: value < 60,
  }));

  return (
    <GlassCard className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Adherence Trend</CardTitle>
        <p className="text-xs text-muted-foreground">Daily completion rate (last 14 days)</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    return (
                      <div className="bg-popover border border-border rounded-md px-3 py-2 shadow-md">
                        <p className="text-sm font-medium">{value}%</p>
                        <p className="text-xs text-muted-foreground">{payload[0].payload.day}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine 
                y={60} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
              />
              <Area
                type="monotone"
                dataKey="adherence"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#adherenceGradient)"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.belowThreshold) {
                    return (
                      <circle
                        key={`dot-${payload.day}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="hsl(var(--destructive))"
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    );
                  }
                  return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={0} />;
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </GlassCard>
  );
}
