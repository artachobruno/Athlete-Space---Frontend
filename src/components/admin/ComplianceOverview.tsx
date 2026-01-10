import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceOverviewProps {
  executedPct: number;
  missedReasons: {
    fatigue: number;
    skipped: number;
    conflict: number;
  };
  trend: 'up' | 'down' | 'stable';
}

export function ComplianceOverview({ executedPct, missedReasons, trend }: ComplianceOverviewProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-muted-foreground';
  const trendLabel = trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable';

  const totalMissed = missedReasons.fatigue + missedReasons.skipped + missedReasons.conflict;
  const missedBreakdown = [
    { label: "Fatigue", value: missedReasons.fatigue, color: "bg-orange-500" },
    { label: "Skipped", value: missedReasons.skipped, color: "bg-yellow-500" },
    { label: "Conflict", value: missedReasons.conflict, color: "bg-red-500" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Calendar Compliance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main metric */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{executedPct}%</div>
            <div className="text-sm text-muted-foreground">Planned vs Executed</div>
          </div>
          <div className={cn("flex items-center gap-1", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">{trendLabel}</span>
          </div>
        </div>

        {/* Missed breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Missed Sessions ({totalMissed}%)</div>
          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
            {missedBreakdown.map((item) => (
              <div
                key={item.label}
                className={cn("h-full", item.color)}
                style={{ width: `${(item.value / totalMissed) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {missedBreakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-1">
                <div className={cn("h-2 w-2 rounded-full", item.color)} />
                <span>{item.label}: {item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
