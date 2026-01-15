import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadRecoveryPanelProps {
  loadRisk: 'safe' | 'watch' | 'high';
  recoveryAligned: boolean;
  summary: string;
}

export function LoadRecoveryPanel({ loadRisk, recoveryAligned, summary }: LoadRecoveryPanelProps) {
  const riskConfig = {
    safe: {
      icon: Shield,
      label: "Safe",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
      borderColor: "border-green-200 dark:border-green-800",
    },
    watch: {
      icon: AlertTriangle,
      label: "Watch",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-950",
      borderColor: "border-yellow-200 dark:border-yellow-800",
    },
    high: {
      icon: XCircle,
      label: "High Risk",
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-950",
      borderColor: "border-red-200 dark:border-red-800",
    },
  };

  const config = riskConfig[loadRisk];
  const RiskIcon = config.icon;

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Load & Recovery Safety</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk status */}
        <div className={cn("flex items-center gap-3 p-3 rounded-lg border", config.bgColor, config.borderColor)}>
          <RiskIcon className={cn("h-6 w-6", config.color)} />
          <div>
            <div className={cn("font-semibold", config.color)}>{config.label}</div>
            <div className="text-xs text-muted-foreground">Current risk state</div>
          </div>
        </div>

        {/* Recovery alignment */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm">Recovery Aligned</span>
          <span className={cn("text-sm font-medium", recoveryAligned ? "text-green-600" : "text-red-600")}>
            {recoveryAligned ? "Yes" : "No"}
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardContent>
    </GlassCard>
  );
}
