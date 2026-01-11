/**
 * Phase 7: Plan Overview Sidebar Component
 * 
 * Optional sidebar that shows high-level plan information
 * to reassure users before they scroll through weeks.
 */

import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeekPlan } from '@/types/execution';

interface PlanOverviewSidebarProps {
  plans: WeekPlan[];
  raceType?: string;
  philosophyName?: string;
}

export function PlanOverviewSidebar({
  plans,
  raceType,
  philosophyName,
}: PlanOverviewSidebarProps) {
  if (plans.length === 0) {
    return null;
  }

  const firstWeek = plans[0];
  const lastWeek = plans[plans.length - 1];
  const startDate = parseISO(firstWeek.weekStart);
  const endDate = parseISO(lastWeek.weekEnd);

  // Calculate average weekly time
  const totalDuration = plans.reduce((sum, week) => {
    return (
      sum +
      week.sessions.reduce((weekSum, session) => weekSum + session.duration, 0)
    );
  }, 0);
  const avgWeeklyMinutes = Math.round(totalDuration / plans.length);
  const avgHours = Math.floor(avgWeeklyMinutes / 60);
  const avgMins = avgWeeklyMinutes % 60;
  const avgWeeklyTime =
    avgMins === 0 ? `${avgHours} hr` : `${avgHours} hr ${avgMins} min`;

  const totalSessions = plans.reduce(
    (sum, week) => sum + week.sessions.length,
    0
  );

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg">Plan Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {raceType && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Race Type</div>
            <div className="text-sm font-medium">{raceType}</div>
          </div>
        )}

        <div>
          <div className="text-xs text-muted-foreground mb-1">Date Range</div>
          <div className="text-sm font-medium">
            {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
          </div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">Weeks</div>
          <div className="text-sm font-medium">{plans.length}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Total Sessions
          </div>
          <div className="text-sm font-medium">{totalSessions}</div>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-1">
            Avg Weekly Time
          </div>
          <div className="text-sm font-medium">{avgWeeklyTime}</div>
        </div>

        {philosophyName && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              Philosophy
            </div>
            <div className="text-sm font-medium">{philosophyName}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
