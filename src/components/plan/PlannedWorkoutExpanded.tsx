import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline'
import { WorkoutStepsTable } from '@/components/workout/WorkoutStepsTable'
import { WorkoutExport } from '@/components/workout/WorkoutExport'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout'
import { Loader2 } from 'lucide-react'

interface PlannedWorkoutExpandedProps {
  workoutId: string
}

export function PlannedWorkoutExpanded({ workoutId }: PlannedWorkoutExpandedProps) {
  const state = useStructuredWorkout(workoutId)

  if (state.status === 'loading') {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="text-center py-4 text-sm text-muted-foreground">
          Unable to load workout details
        </div>
      </div>
    )
  }

  const { data } = state
  const { workout, steps } = data

  if (!steps || steps.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="text-center py-4 text-sm text-muted-foreground">
          No structured steps available
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      {/* Timeline */}
      <WorkoutTimeline
        steps={steps}
        totalDistanceMeters={workout.total_distance_meters}
        totalDurationSeconds={workout.total_duration_seconds}
      />

      {/* Step Table */}
      <WorkoutStepsTable steps={steps} />

      {/* Actions */}
      <div className="flex gap-2">
        <WorkoutExport workoutId={workoutId} />
        <Button variant="secondary" size="sm">
          <MessageCircle className="h-4 w-4 mr-2" />
          Ask Coach
        </Button>
      </div>
    </div>
  )
}
