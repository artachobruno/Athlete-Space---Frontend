import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';

interface AdherenceChartProps {
  data: number[];
}

/**
 * Adherence trend chart for Coach Dashboard
 * F1 Design: Instrument panel style with thin strokes
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
    <F1Card>
      <F1CardHeader>
        <div>
          <F1CardTitle>Adherence Trend</F1CardTitle>
          <F1CardLabel className="mt-1 block">Daily completion rate (last 14 days)</F1CardLabel>
        </div>
      </F1CardHeader>
      
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* F1 telemetry gradient - subtle */}
              <linearGradient id="adherenceGradientF1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent-telemetry))" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(var(--accent-telemetry))" stopOpacity={0} />
              </linearGradient>
            </defs>
            
            {/* F1 axis styling - minimal */}
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 9, fill: 'hsl(var(--f1-text-tertiary))', fontFamily: 'JetBrains Mono, monospace' }} 
              tickLine={false}
              axisLine={{ stroke: 'hsl(215 20% 20%)', strokeWidth: 0.5 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 9, fill: 'hsl(var(--f1-text-tertiary))', fontFamily: 'JetBrains Mono, monospace' }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              ticks={[0, 60, 100]}
            />
            
            {/* F1 tooltip - glass style */}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const value = payload[0].value as number;
                  const isBelowThreshold = value < 60;
                  return (
                    <div className="f1-surface-strong rounded-f1 px-3 py-2">
                      <p className={`f1-metric f1-metric-sm ${isBelowThreshold ? 'f1-status-danger' : 'f1-status-safe'}`}>
                        {value}%
                      </p>
                      <p className="f1-label mt-1">{payload[0].payload.day}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Threshold reference line - F1 danger color */}
            <ReferenceLine 
              y={60} 
              stroke="hsl(var(--accent-danger))" 
              strokeDasharray="4 4" 
              strokeOpacity={0.4}
              strokeWidth={1}
              label={{ 
                value: 'Baseline', 
                position: 'right', 
                fontSize: 9, 
                fill: 'hsl(var(--f1-text-muted))',
                fontFamily: 'JetBrains Mono, monospace'
              }}
            />
            
            {/* F1 area chart - thin stroke */}
            <Area
              type="monotone"
              dataKey="adherence"
              stroke="hsl(var(--accent-telemetry))"
              strokeWidth={1.5}
              fill="url(#adherenceGradientF1)"
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.belowThreshold) {
                  return (
                    <circle
                      key={`dot-${payload.day}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="hsl(var(--accent-danger))"
                      stroke="hsl(var(--surface-void))"
                      strokeWidth={1.5}
                    />
                  );
                }
                return <circle key={`dot-${payload.day}`} cx={cx} cy={cy} r={0} />;
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </F1Card>
  );
}
