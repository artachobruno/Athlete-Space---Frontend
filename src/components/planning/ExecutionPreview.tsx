/**
 * Phase 6B: Execution Preview Component
 * 
 * Displays a read-only preview of sessions that will be scheduled.
 * Frontend never mutates plans - this is display only.
 */

import { format, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Route, FileText } from 'lucide-react';
import type { WeekPlan } from '@/types/execution';
import { cn } from '@/lib/utils';

interface ExecutionPreviewProps {
  weekPlans: WeekPlan[];
  startDate: string;
  timezone: string;
}

/**
 * Maps session type to display label
 */
const getSessionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    easy: 'Easy',
    tempo: 'Tempo',
    long: 'Long',
    workout: 'Workout',
    recovery: 'Recovery',
    rest: 'Rest',
  };
  return labels[type] || type;
};

/**
 * Maps session type to badge variant
 */
const getSessionTypeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
  if (type === 'rest') return 'outline';
  if (type === 'recovery') return 'secondary';
  return 'default';
};

/**
 * Converts km to miles for display
 */
const kmToMiles = (km: number): number => {
  return km * 0.621371;
};

export function ExecutionPreview({ weekPlans, startDate, timezone }: ExecutionPreviewProps) {
  // Flatten all sessions from all weeks
  const allSessions = weekPlans.flatMap(week => 
    week.sessions.map(session => ({
      ...session,
      weekNumber: week.week,
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      coachNotes: week.coachNotes,
    }))
  );

  // Sort by date
  const sortedSessions = [...allSessions].sort((a, b) => 
    a.date.localeCompare(b.date)
  );

  // Group sessions by week for display
  const sessionsByWeek = weekPlans.map(week => ({
    week,
    sessions: week.sessions.sort((a, b) => a.date.localeCompare(b.date)),
  }));

  if (sortedSessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground text-sm">
            No sessions to preview
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Execution Preview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Review the sessions that will be scheduled. This is a read-only preview.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {sessionsByWeek.map(({ week, sessions }) => (
          <div key={week.week} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-sm">
                Week {week.week}
              </h3>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(week.weekStart), 'MMM d')} - {format(parseISO(week.weekEnd), 'MMM d, yyyy')}
              </span>
            </div>

            {week.coachNotes && (
              <div className="bg-accent/50 rounded-md p-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{week.coachNotes}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {sessions.map((session) => {
                const sessionDate = parseISO(session.date);
                const dateStr = format(sessionDate, 'EEEE, MMM d, yyyy');

                return (
                  <div
                    key={session.session_id}
                    className="border rounded-lg p-4 space-y-3 bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getSessionTypeVariant(session.type)}>
                            {getSessionTypeLabel(session.type)}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {session.template_name}
                          </span>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          {dateStr}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {session.duration > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              <span>{session.duration} min</span>
                            </div>
                          )}
                          {session.distance && session.distance > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Route className="h-4 w-4" />
                              <span>
                                {session.distance.toFixed(1)} km
                                {' '}
                                <span className="text-xs">
                                  ({kmToMiles(session.distance).toFixed(1)} mi)
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        {session.notes && (
                          <div className="text-sm text-muted-foreground pt-1 border-t">
                            {session.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Total sessions: {sortedSessions.length}</span>
            <span>Weeks: {weekPlans.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
