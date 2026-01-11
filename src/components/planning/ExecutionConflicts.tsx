/**
 * Phase 6B: Execution Conflicts Component
 * 
 * Displays conflicts detected during execution preview.
 * Frontend never resolves conflicts - user must resolve manually.
 */

import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, XCircle } from 'lucide-react';
import type { ExecutionConflict, WeekPlan } from '@/types/execution';
import { cn } from '@/lib/utils';

interface ExecutionConflictsProps {
  conflicts: ExecutionConflict[];
  weekPlans: WeekPlan[];
}

/**
 * Gets the session details from week plans
 */
const getSessionDetails = (
  sessionId: string,
  weekPlans: WeekPlan[]
): { date: string; type: string; templateName: string } | null => {
  for (const week of weekPlans) {
    const session = week.sessions.find(s => s.session_id === sessionId);
    if (session) {
      return {
        date: session.date,
        type: session.type,
        templateName: session.template_name,
      };
    }
  }
  return null;
};

/**
 * Gets reason display text
 */
const getReasonText = (reason: 'overlap' | 'manual_edit'): string => {
  if (reason === 'overlap') {
    return 'Overlaps with existing session';
  }
  return 'Conflicts with manually edited session';
};

export function ExecutionConflicts({ conflicts, weekPlans }: ExecutionConflictsProps) {
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Execution Blocked
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4">
          <p className="text-sm font-medium text-destructive mb-2">
            This plan cannot be scheduled because it overlaps with existing sessions.
          </p>
          <p className="text-sm text-muted-foreground">
            Please resolve conflicts manually before continuing.
          </p>
        </div>

        <div className="space-y-3">
          {conflicts.map((conflict, index) => {
            const plannedSession = getSessionDetails(conflict.session_id, weekPlans);
            const conflictDate = parseISO(conflict.date);
            const dateStr = format(conflictDate, 'EEEE, MMM d, yyyy');

            return (
              <div
                key={`${conflict.session_id}-${conflict.existing_session_id}-${index}`}
                className="border border-destructive/30 rounded-lg p-4 bg-card space-y-3"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <div className="text-sm font-medium text-foreground">
                      Conflict on {dateStr}
                    </div>

                    {plannedSession && (
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          <span className="font-medium">Planned session:</span>{' '}
                          {plannedSession.templateName} ({plannedSession.type})
                        </div>
                        <div>
                          <span className="font-medium">Reason:</span>{' '}
                          {getReasonText(conflict.reason)}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Existing session ID: {conflict.existing_session_id}
                    </div>
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
