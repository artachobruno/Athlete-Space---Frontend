import { useMemo } from 'react';
import type { ParsedWorkout } from '@/lib/api';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ParsedWorkoutPreviewProps {
  parsedWorkout: ParsedWorkout;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes} min`;
  }
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function formatDistance(meters: number, convertDistance: (km: number) => { value: number; unit: string }): string {
  const km = meters / 1000;
  const converted = convertDistance(km);
  return `${converted.value.toFixed(1)} ${converted.unit}`;
}

export function ParsedWorkoutPreview({ parsedWorkout }: ParsedWorkoutPreviewProps) {
  const { convertDistance } = useUnitSystem();

  const stepsWithRepeats = useMemo(() => {
    if (!parsedWorkout.workout?.steps) return [];
    
    const steps = [...parsedWorkout.workout.steps];
    const repeats = parsedWorkout.workout.repeats || [];
    
    // Group steps by repeats
    const grouped: Array<{
      steps: typeof steps;
      isRepeat: boolean;
      repeatCount?: number;
    }> = [];
    
    let i = 0;
    while (i < steps.length) {
      const repeat = repeats.find(r => r.start_step === i + 1);
      if (repeat) {
        const repeatSteps = steps.slice(repeat.start_step - 1, repeat.end_step);
        grouped.push({
          steps: repeatSteps,
          isRepeat: true,
          repeatCount: repeat.count,
        });
        i = repeat.end_step;
      } else {
        grouped.push({
          steps: [steps[i]],
          isRepeat: false,
        });
        i++;
      }
    }
    
    return grouped;
  }, [parsedWorkout.workout]);

  if (!parsedWorkout.workout || !parsedWorkout.workout.steps || parsedWorkout.workout.steps.length === 0) {
    return null;
  }

  const getIntensityColor = (intensity?: string): string => {
    if (!intensity) return 'bg-gray-100 text-gray-700 border-gray-200';
    const lower = intensity.toLowerCase();
    if (lower.includes('warmup') || lower.includes('cooldown') || lower.includes('easy') || lower.includes('recovery')) {
      return 'bg-green-100 text-green-700 border-green-200';
    }
    if (lower.includes('threshold') || lower.includes('lt2') || lower.includes('tempo')) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    if (lower.includes('interval') || lower.includes('vo2') || lower.includes('hard')) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Structured Workout Preview</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Preview only — steps will be generated after saving.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {stepsWithRepeats.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {group.isRepeat && group.repeatCount ? (
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="font-semibold">
                  {group.repeatCount}x Repeat
                </Badge>
              </div>
            ) : null}
            <div className={group.isRepeat ? 'ml-4 space-y-2 border-l-2 border-primary/30 pl-3' : 'space-y-2'}>
              {group.steps.map((step, stepIdx) => (
                <div
                  key={stepIdx}
                  className="flex items-start justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {group.isRepeat ? `${groupIdx + 1}.${stepIdx + 1}` : `${step.order}.`}
                      </span>
                      <span className="font-medium capitalize text-sm">{step.type}</span>
                      {step.intensity && (
                        <Badge variant="outline" className={`text-xs ${getIntensityColor(step.intensity)}`}>
                          {step.intensity}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {step.duration_seconds && (
                        <div>Duration: {formatDuration(step.duration_seconds)}</div>
                      )}
                      {step.distance_meters && (
                        <div>Distance: {formatDistance(step.distance_meters, convertDistance)}</div>
                      )}
                      {step.notes && (
                        <div className="italic">{step.notes}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {(parsedWorkout.workout.total_duration_seconds || parsedWorkout.workout.total_distance_meters) && (
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <div className="flex justify-between">
              {parsedWorkout.workout.total_duration_seconds && (
                <span>Total: {formatDuration(parsedWorkout.workout.total_duration_seconds)}</span>
              )}
              {parsedWorkout.workout.total_distance_meters && (
                <span>Total: {formatDistance(parsedWorkout.workout.total_distance_meters, convertDistance)}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
