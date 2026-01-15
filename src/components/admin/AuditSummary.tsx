import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, FileCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditSummaryProps {
  tracedPct: number;
  confirmedWritesPct: number;
  auditedToolsPct: number;
}

export function AuditSummary({ tracedPct, confirmedWritesPct, auditedToolsPct }: AuditSummaryProps) {
  const metrics = [
    {
      icon: CheckCircle,
      label: "Decisions Traced",
      value: tracedPct,
      description: "Full trace available",
    },
    {
      icon: FileCheck,
      label: "Writes Confirmed",
      value: confirmedWritesPct,
      description: "Plan writes confirmed",
    },
    {
      icon: Wrench,
      label: "Tools Audited",
      value: auditedToolsPct,
      description: "Tool calls audited",
    },
  ];

  const getStatusColor = (value: number) => {
    if (value >= 99) return "text-green-600";
    if (value >= 90) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Audit & Traceability</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-5 w-5", getStatusColor(metric.value))} />
                  <div>
                    <div className="text-sm font-medium">{metric.label}</div>
                    <div className="text-xs text-muted-foreground">{metric.description}</div>
                  </div>
                </div>
                <div className={cn("text-lg font-semibold", getStatusColor(metric.value))}>
                  {metric.value}%
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </GlassCard>
  );
}
