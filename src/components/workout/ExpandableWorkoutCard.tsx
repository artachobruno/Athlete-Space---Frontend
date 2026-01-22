import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout'
import { WorkoutHeader } from './WorkoutHeader'
import { WorkoutTimeline } from './WorkoutTimeline'
import { WorkoutComparison } from './WorkoutComparison'
import { WorkoutStepsTable } from './WorkoutStepsTable'
import { ParseStatusBanner } from './ParseStatusBanner'
import { cn } from '@/lib/utils'

interface ExpandableWorkoutCardProps {
  workoutId: string
  /** Whether the card starts expanded */
  defaultExpanded?: boolean
  /** Additional CSS classes */
  className?: string
}

export function ExpandableWorkoutCard({
  workoutId,
  defaultExpanded = false,
  className,
}: ExpandableWorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const state = useStructuredWorkout(workoutId)

  if (state.status === 'loading') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (state.status === 'error') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3">
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Unable to load workout</p>
            <p className="text-xs mt-1">{state.error}</p>
          </div>
        </CardHeader>
      </Card>
    )
  }

  const { data } = state
  const { workout, steps, groups = [], structured_available, comparison } = data

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <WorkoutHeader workout={workout} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Expand
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6 pt-0">
          {!structured_available && steps.length === 0 && (
            <ParseStatusBanner parseStatus={workout.parse_status} />
          )}

          {structured_available && steps.length > 0 && (
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
                  <WorkoutStepsTable steps={steps} groups={groups} />
                </CardContent>
              </Card>
            </>
          )}

          {!structured_available && steps.length === 0 && (
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
        </CardContent>
      )}
    </Card>
  )
}
