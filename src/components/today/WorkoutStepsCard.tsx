// ❗ DO NOT PARSE WORKOUTS FROM TEXT
// All workout structure must come from workout.steps
// Never use regex, split(), match(), or pattern logic to extract workout data

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WorkoutStep } from '@/lib/api';

interface WorkoutStepsCardProps {
  steps: WorkoutStep[];
  className?: string;
}

function formatStepDuration(durationMin: number | null): string {
  if (!durationMin) return '';
  if (durationMin < 60) {
    return `${durationMin} min`;
  }
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

function formatStepDistance(distanceKm: number | null): string {
  if (!distanceKm) return '';
  return `${distanceKm.toFixed(1)} km`;
}

export function WorkoutStepsCard({ steps, className }: WorkoutStepsCardProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Workout Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const details: string[] = [];
            if (step.duration_min) {
              details.push(formatStepDuration(step.duration_min));
            }
            if (step.distance_km) {
              details.push(formatStepDistance(step.distance_km));
            }
            if (step.intensity) {
              details.push(step.intensity);
            }

            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{step.name}</div>
                  {details.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {details.join(' • ')}
                    </div>
                  )}
                  {step.notes && (
                    <div className="text-sm text-foreground/80 mt-1">{step.notes}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
