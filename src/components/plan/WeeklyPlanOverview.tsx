import { Card, CardContent } from '@/components/ui/card';
import { mockWeeklyPlan } from '@/lib/mock-data';
import { format, parseISO } from 'date-fns';
import { Target, TrendingUp } from 'lucide-react';

export function WeeklyPlanOverview() {
  const plan = mockWeeklyPlan;
  const progress = (plan.actualLoad / plan.plannedLoad) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left: Week info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Current Week</div>
              <h2 className="text-xl font-semibold text-foreground">
                {format(parseISO(plan.weekStart), 'MMM d')} – {format(parseISO(plan.weekEnd), 'MMM d, yyyy')}
              </h2>
            </div>

            {/* Weekly Focus */}
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-foreground">Aerobic Base Development</span>
            </div>

            {/* Load Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Weekly Load</span>
                <span className="font-medium text-foreground">
                  {plan.actualLoad} / {plan.plannedLoad} TSS
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>{progress.toFixed(0)}% complete</span>
              </div>
            </div>
          </div>

          {/* Right: Coach Note */}
          <div className="lg:w-1/2 bg-muted/50 rounded-lg p-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Coach Notes
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {plan.coachNotes}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
