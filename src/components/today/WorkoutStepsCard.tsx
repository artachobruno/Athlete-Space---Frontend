// ❗ DO NOT PARSE WORKOUTS FROM TEXT
// All workout structure must come from workout.steps
// Never use regex, split(), match(), or pattern logic to extract workout data

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { WorkoutStep } from '@/lib/api';
import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline';
import type { StructuredWorkoutStep } from '@/api/workouts';

interface WorkoutStepsCardProps {
  steps: WorkoutStep[];
  className?: string;
}

/**
 * Convert WorkoutStep (from calendar API) to StructuredWorkoutStep (for WorkoutTimeline)
 */
function convertToStructuredStep(step: WorkoutStep, index: number): StructuredWorkoutStep {
  // Infer step_type from intensity or default to 'steady'
  const intensity = step.intensity?.toLowerCase() || '';
  let stepType = 'steady';
  
  if (intensity.includes('warmup') || intensity.includes('warm')) {
    stepType = 'warmup';
  } else if (intensity.includes('cooldown') || intensity.includes('cool')) {
    stepType = 'cooldown';
  } else if (intensity.includes('recovery') || intensity.includes('rest')) {
    stepType = 'recovery';
  } else if (intensity.includes('interval') || intensity.includes('vo2')) {
    stepType = 'interval';
  } else if (intensity.includes('tempo') || intensity.includes('threshold')) {
    stepType = 'tempo';
  } else if (intensity.includes('easy')) {
    stepType = 'easy';
  } else if (intensity.includes('steady')) {
    stepType = 'steady';
  }

  return {
    id: `step-${index}`,
    order: step.order,
    name: step.name,
    type: stepType,
    step_type: stepType,
    kind: null,
    intensity: step.intensity,
    distance_meters: step.distance_km ? step.distance_km * 1000 : null,
    duration_seconds: step.duration_min ? step.duration_min * 60 : null,
    target: null,
    target_type: null,
    target_metric: null,
    target_min: null,
    target_max: null,
    target_value: null,
    repeat_group_id: null,
    instructions: step.notes || null,
    purpose: null,
    inferred: false,
  };
}

export function WorkoutStepsCard({ steps, className }: WorkoutStepsCardProps) {
  const structuredSteps = useMemo(() => {
    return steps.map((step, index) => convertToStructuredStep(step, index));
  }, [steps]);

  const totalDistanceMeters = useMemo(() => {
    return structuredSteps.reduce((sum, step) => {
      return sum + (step.distance_meters || 0);
    }, 0);
  }, [structuredSteps]);

  const totalDurationSeconds = useMemo(() => {
    return structuredSteps.reduce((sum, step) => {
      return sum + (step.duration_seconds || 0);
    }, 0);
  }, [structuredSteps]);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Workout Steps</CardTitle>
      </CardHeader>
      <CardContent>
        <WorkoutTimeline
          steps={structuredSteps}
          totalDistanceMeters={totalDistanceMeters > 0 ? totalDistanceMeters : null}
          totalDurationSeconds={totalDurationSeconds > 0 ? totalDurationSeconds : null}
        />
      </CardContent>
    </Card>
  );
}
