import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface DecisionAnalyticsProps {
  intentDistribution: {
    plan: number;
    modify: number;
    explain: number;
    upload: number;
  };
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
  outcomes: {
    applied: number;
    blocked: number;
    escalated: number;
  };
}

const intentChartConfig = {
  plan: { label: "Plan", color: "hsl(var(--chart-1))" },
  modify: { label: "Modify", color: "hsl(var(--chart-2))" },
  explain: { label: "Explain", color: "hsl(var(--chart-3))" },
  upload: { label: "Upload", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

const confidenceChartConfig = {
  high: { label: "High", color: "hsl(142 76% 36%)" },
  medium: { label: "Medium", color: "hsl(48 96% 53%)" },
  low: { label: "Low", color: "hsl(0 84% 60%)" },
} satisfies ChartConfig;

const outcomeChartConfig = {
  applied: { label: "Applied", color: "hsl(142 76% 36%)" },
  blocked: { label: "Blocked", color: "hsl(0 84% 60%)" },
  escalated: { label: "Escalated", color: "hsl(48 96% 53%)" },
} satisfies ChartConfig;

export function DecisionAnalytics({ intentDistribution, confidence, outcomes }: DecisionAnalyticsProps) {
  const intentData = [
    { name: "Plan", value: intentDistribution.plan, fill: "hsl(var(--chart-1))" },
    { name: "Modify", value: intentDistribution.modify, fill: "hsl(var(--chart-2))" },
    { name: "Explain", value: intentDistribution.explain, fill: "hsl(var(--chart-3))" },
    { name: "Upload", value: intentDistribution.upload, fill: "hsl(var(--chart-4))" },
  ];

  const confidenceData = [
    { name: "High", value: confidence.high, fill: "hsl(142 76% 36%)" },
    { name: "Medium", value: confidence.medium, fill: "hsl(48 96% 53%)" },
    { name: "Low", value: confidence.low, fill: "hsl(0 84% 60%)" },
  ];

  const outcomeData = [
    { name: "Applied", value: outcomes.applied, fill: "hsl(142 76% 36%)" },
    { name: "Blocked", value: outcomes.blocked, fill: "hsl(0 84% 60%)" },
    { name: "Escalated", value: outcomes.escalated, fill: "hsl(48 96% 53%)" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Intent Distribution */}
      <GlassCard>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Intent Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={intentChartConfig} className="h-[180px] w-full">
            <PieChart>
              <Pie
                data={intentData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {intentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </GlassCard>

      {/* Confidence Buckets */}
      <GlassCard>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Confidence Buckets</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={confidenceChartConfig} className="h-[180px] w-full">
            <BarChart data={confidenceData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" width={60} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={4}>
                {confidenceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </GlassCard>

      {/* Outcome Summary */}
      <GlassCard>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Outcome Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={outcomeChartConfig} className="h-[180px] w-full">
            <PieChart>
              <Pie
                data={outcomeData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {outcomeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </GlassCard>
    </div>
  );
}
