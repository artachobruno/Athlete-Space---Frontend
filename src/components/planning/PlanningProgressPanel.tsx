import { usePlanningProgressStore } from "@/store/planningProgressStore";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { labelForPhase } from "./labels";
import { SummaryBlock } from "./SummaryBlock";
import { useMemo } from "react";

export function PlanningProgressPanel() {
  const { percent, events, lastEventTimestamp } = usePlanningProgressStore();

  const stalled = useMemo(() => {
    if (events.length === 0) return false;
    if (!lastEventTimestamp) return false;
    const now = Date.now();
    const timeSinceLastEvent = now - lastEventTimestamp;
    // Stalled if no new events in last 30 seconds
    return timeSinceLastEvent > 30_000;
  }, [events.length, lastEventTimestamp]);

  if (events.length === 0) return null;

  return (
    <div className="rounded-xl border p-4 space-y-4">
      {stalled && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Planning is taking longer than expected...</AlertTitle>
          <AlertDescription>
            The planning process is still running. Please wait.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{percent}%</span>
        </div>
        <Progress value={percent} />
      </div>

      <ul className="space-y-2">
        {events.map((e, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium">{labelForPhase(e.phase)}</span>
              <span className="text-muted-foreground">{e.message}</span>
            </div>
            {e.summary && <SummaryBlock summary={e.summary} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
