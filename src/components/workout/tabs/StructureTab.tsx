import { Loader2 } from 'lucide-react';
import { WorkoutStepsTable } from '../WorkoutStepsTable';
import { WorkoutComparison } from '../WorkoutComparison';
import type { StructuredWorkoutStep, StructuredWorkoutComparison } from '@/api/workouts';

interface StructureTabProps {
  isPlanned: boolean;
  structuredWorkout?: {
    steps: StructuredWorkoutStep[];
    comparison?: StructuredWorkoutComparison[];
    workout: {
      total_distance_meters: number | null;
      total_duration_seconds: number | null;
    };
  } | null;
  isLoading?: boolean;
}

export function StructureTab({ isPlanned, structuredWorkout, isLoading }: StructureTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!structuredWorkout || !structuredWorkout.steps || structuredWorkout.steps.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No structured workout data available
      </div>
    );
  }

  if (isPlanned) {
    // Planned: show step targets only
    return <WorkoutStepsTable steps={structuredWorkout.steps} />;
  }

  // Completed: show planned vs actual comparison
  const comparison = structuredWorkout.comparison;
  if (!comparison || !Array.isArray(comparison) || comparison.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No execution data available
      </div>
    );
  }

  return (
    <WorkoutComparison
      steps={structuredWorkout.steps}
      comparison={comparison}
      totalDistanceMeters={structuredWorkout.workout.total_distance_meters}
      totalDurationSeconds={structuredWorkout.workout.total_duration_seconds}
    />
  );
}
