import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, Minimize2 } from "lucide-react";

interface ConversationHealthPanelProps {
  avgTurns: number;
  summariesPerConv: number;
  compressionRatio: number;
}

export function ConversationHealthPanel({ avgTurns, summariesPerConv, compressionRatio }: ConversationHealthPanelProps) {
  const metrics = [
    {
      icon: MessageSquare,
      label: "Avg Turns",
      value: avgTurns.toFixed(1),
      subtext: "turns per conversation",
    },
    {
      icon: FileText,
      label: "Summaries",
      value: summariesPerConv.toFixed(1),
      subtext: "per conversation",
    },
    {
      icon: Minimize2,
      label: "Compression",
      value: `${(compressionRatio * 100).toFixed(0)}%`,
      subtext: "token reduction",
    },
  ];

  return (
    <GlassCard>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Conversation Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.label} className="text-center space-y-1">
                <Icon className="h-5 w-5 mx-auto text-muted-foreground" />
                <div className="text-xl font-semibold">{metric.value}</div>
                <div className="text-xs text-muted-foreground">{metric.subtext}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </GlassCard>
  );
}
