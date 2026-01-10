import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

interface PlanningFunnelProps {
  funnel: {
    intent: number;
    generated: number;
    confirmed: number;
    persisted: number;
    compliant: number;
  };
}

export function PlanningFunnel({ funnel }: PlanningFunnelProps) {
  const stages = [
    { label: "Intent", value: funnel.intent, key: "intent" },
    { label: "Plan Generated", value: funnel.generated, key: "generated" },
    { label: "Confirmed", value: funnel.confirmed, key: "confirmed" },
    { label: "Persisted", value: funnel.persisted, key: "persisted" },
    { label: "Compliant", value: funnel.compliant, key: "compliant" },
  ];

  const getDropReason = (fromKey: string, toKey: string): string | null => {
    if (fromKey === "intent" && toKey === "generated") return "Generation failures";
    if (fromKey === "generated" && toKey === "confirmed") return "Confirmation missing";
    if (fromKey === "confirmed" && toKey === "persisted") return "Conflict detected";
    if (fromKey === "persisted" && toKey === "compliant") return "Compliance issues";
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Planning Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {stages.map((stage, index) => {
            const prevValue = index > 0 ? stages[index - 1].value : 100;
            const dropOff = prevValue - stage.value;
            const dropReason = index > 0 ? getDropReason(stages[index - 1].key, stage.key) : null;
            const widthPercent = (stage.value / 100) * 100;

            return (
              <div key={stage.key}>
                {index > 0 && (
                  <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
                    <ArrowDown className="h-3 w-3" />
                    <span>
                      -{dropOff}% {dropReason && `(${dropReason})`}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.label}</span>
                    <span className="text-muted-foreground">{stage.value}%</span>
                  </div>
                  <div className="h-6 bg-muted rounded-sm overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-sm transition-all duration-500"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
