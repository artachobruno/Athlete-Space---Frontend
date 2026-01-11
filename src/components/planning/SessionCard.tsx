/**
 * Phase 7: Session Card Component
 * 
 * Displays a concrete, explainable session in the review UI.
 * Read-only display of session details.
 */

import { format, parseISO } from 'date-fns';
import { Clock, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SessionExplanation } from './SessionExplanation';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import type { PlanSession } from '@/types/execution';

interface SessionCardProps {
  session: PlanSession;
}

/**
 * Maps session type to display label
 */
function getSessionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    easy: 'Easy',
    tempo: 'Tempo',
    long: 'Long',
    workout: 'Workout',
    recovery: 'Recovery',
    rest: 'Rest',
  };
  return labels[type] || type;
}

/**
 * Maps session type to badge variant
 */
function getSessionTypeVariant(type: string): 'default' | 'secondary' | 'outline' {
  if (type === 'rest') return 'outline';
  if (type === 'recovery') return 'secondary';
  return 'default';
}

export function SessionCard({ session }: SessionCardProps) {
  const { convertDistance } = useUnitSystem();
  const sessionDate = parseISO(session.date);
  const dayName = format(sessionDate, 'EEEE');
  const dateStr = format(sessionDate, 'MMM d, yyyy');

  const distanceDisplay = session.distance
    ? convertDistance(session.distance)
    : null;

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-card">
      {/* Session Header */}
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

          <div className="text-sm text-foreground">
            <span className="font-medium">{dayName}</span>
            {' • '}
            <span className="text-muted-foreground">{dateStr}</span>
          </div>

          {/* Session Details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {session.duration > 0 && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{session.duration} min</span>
              </div>
            )}
            {distanceDisplay && (
              <div className="flex items-center gap-1.5">
                <Route className="h-4 w-4" />
                <span>
                  {distanceDisplay.value.toFixed(1)} {distanceDisplay.unit}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Session Explanation */}
      <SessionExplanation session={session} />
    </div>
  );
}
