import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Target, RotateCcw, ShieldAlert } from "lucide-react";

interface RagHealthPanelProps {
  usagePct: number;
  avgConfidence: number;
  fallbackRate: number;
  safetyBlocks: number;
}

export function RagHealthPanel({ usagePct, avgConfidence, fallbackRate, safetyBlocks }: RagHealthPanelProps) {
  const metrics = [
    {
      icon: Database,
      label: "RAG Usage",
      value: `${usagePct}%`,
      subtext: "responses using RAG",
    },
    {
      icon: Target,
      label: "Avg Confidence",
      value: `${(avgConfidence * 100).toFixed(0)}%`,
      subtext: "retrieval confidence",
    },
    {
      icon: RotateCcw,
      label: "Fallback Rate",
      value: `${fallbackRate}%`,
      subtext: "non-RAG responses",
    },
    {
      icon: ShieldAlert,
      label: "Safety Blocks",
      value: safetyBlocks.toString(),
      subtext: "triggered this period",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">RAG Performance Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs">{metric.label}</span>
                </div>
                <div className="text-xl font-semibold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.subtext}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
