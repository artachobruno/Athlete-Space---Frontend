import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface AdherenceChartProps {
  data: number[];
}

/**
 * Adherence trend chart for Coach Dashboard
 * Shows daily adherence % over the last 14 days
 * Highlights dips below 60% threshold
 */
export function AdherenceChart({ data }: AdherenceChartProps) {
  // Transform array to chart data format
  const chartData = data.map((value, index) => ({
    day: `D${index + 1}`,
    adherence: value,
    belowThreshold: value < 60,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Adherence Trend</CardTitle>
        <CardDescription>Daily completion rate (last 14 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <XAxis 
                dataKey="day" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={[0, 100]} 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                ticks={[0, 60, 100]}
              />
              
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    const isBelowThreshold = value < 60;
                    return (
                      <div className="bg-card border rounded-lg shadow-lg px-3 py-2">
                        <p className={`text-lg font-semibold ${isBelowThreshold ? 'text-red-500' : 'text-green-500'}`}>
                          {value}%
                        </p>
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
                strokeDasharray="4 4" 
                strokeOpacity={0.5}
                strokeWidth={1}
                label={{ 
                  value: 'Baseline', 
                  position: 'right', 
                  fontSize: 10, 
                  fill: 'hsl(var(--muted-foreground))'
                }}
              />
              
              <Area
                type="monotone"
                dataKey="adherence"
                stroke="hsl(var(--chart-1))"
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
    </Card>
  );
}
