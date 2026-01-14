import { AppLayout } from '@/components/layout/AppLayout'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline'
import { WorkoutComparison } from '@/components/workout/WorkoutComparison'
import { WorkoutStepsTable } from '@/components/workout/WorkoutStepsTable'
import { ParseStatusBanner } from '@/components/workout/ParseStatusBanner'
import { WorkoutExport } from '@/components/workout/WorkoutExport'
import { Card, CardContent } from '@/components/ui/card'

export default function WorkoutDetails() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const state = useStructuredWorkout(workoutId)

  if (state.status === 'loading') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (state.status === 'error') {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load workout</p>
          <p className="text-xs mt-2">{state.error}</p>
        </div>
      </AppLayout>
    )
  }

  const { data } = state
  const { workout, steps, comparison } = data

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <WorkoutHeader workout={workout} />
          <WorkoutExport workoutId={workout.id} />
        </div>

        <ParseStatusBanner parseStatus={workout.parse_status} />

        {steps.length > 0 && (
          <>
            <Card>
              <CardContent className="pt-6">
                <WorkoutTimeline
                  steps={steps}
                  totalDistanceMeters={workout.total_distance_meters}
                  totalDurationSeconds={workout.total_duration_seconds}
                />
              </CardContent>
            </Card>

            {comparison && comparison.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <WorkoutComparison
                    steps={steps}
                    comparison={comparison}
                    totalDistanceMeters={workout.total_distance_meters}
                    totalDurationSeconds={workout.total_duration_seconds}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="pt-6">
                <WorkoutStepsTable steps={steps} />
              </CardContent>
            </Card>
          </>
        )}

        {steps.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <p>No structured steps available</p>
                {workout.parse_status === 'pending' && (
                  <p className="text-xs mt-2">Steps are being generated...</p>
                )}
                {workout.parse_status === 'failed' && (
                  <p className="text-xs mt-2">Unable to parse workout steps</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
