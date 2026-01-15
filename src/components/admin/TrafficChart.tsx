import { GlassCard } from '@/components/ui/GlassCard';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface TrafficDataPoint {
  time: string;
  rpm: number;
}

interface TrafficChartProps {
  data: TrafficDataPoint[];
}

const chartConfig = {
  rpm: {
    label: 'Requests/min',
    color: 'hsl(var(--primary))',
  },
};

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <GlassCard>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Request Volume</CardTitle>
        <p className="text-xs text-muted-foreground">Requests per minute (last 60 min)</p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              width={35}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="rpm"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </GlassCard>
  );
}
