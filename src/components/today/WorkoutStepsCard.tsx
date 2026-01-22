// ❗ DO NOT PARSE WORKOUTS FROM TEXT
// All workout structure must come from workout.steps
// Never use regex, split(), match(), or pattern logic to extract workout data

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WorkoutStep } from '@/lib/api';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { groupWorkoutSteps, type GroupedStep } from '@/lib/workout-grouping';

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

export function WorkoutStepsCard({ steps, className }: WorkoutStepsCardProps) {
  const { convertDistance, formatDistance } = useUnitSystem();

  const groupedSteps = useMemo(() => groupWorkoutSteps(steps), [steps]);

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
          {groupedSteps.map((group, index) => {
            if (group.isRepeat && group.repeatSteps) {
              // Render repeat pattern
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground">{group.name}</div>
                      {group.intensity && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {group.intensity}
                        </div>
                      )}
                    </div>
                  </div>
                  {group.repeatSteps.map((repeatStep, repeatIndex) => {
                    const repeatDetails: string[] = [];
                    if (repeatStep.durationMin) {
                      repeatDetails.push(formatStepDuration(repeatStep.durationMin));
                    }
                    if (repeatStep.distanceKm) {
                      const converted = convertDistance(repeatStep.distanceKm);
                      repeatDetails.push(formatDistance(converted));
                    }
                    if (repeatStep.intensity) {
                      repeatDetails.push(repeatStep.intensity);
                    }

                    return (
                      <div key={repeatIndex} className="flex items-start gap-3 ml-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-foreground">{repeatStep.name}</div>
                          {repeatDetails.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {repeatDetails.join(' • ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Render single or grouped step
            const details: string[] = [];
            if (group.durationMin) {
              details.push(formatStepDuration(group.durationMin));
            }
            if (group.totalDistanceKm) {
              const converted = convertDistance(group.totalDistanceKm);
              details.push(formatDistance(converted));
            }
            if (group.intensity) {
              details.push(group.intensity);
            }

            return (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{group.name}</div>
                  {details.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {details.join(' • ')}
                    </div>
                  )}
                  {group.notes && (
                    <div className="text-sm text-foreground/80 mt-1">{group.notes}</div>
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
