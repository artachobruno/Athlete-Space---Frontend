import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery'
import { getWorkout, getWorkoutTimeline } from '@/api/workouts'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { WorkoutGraph } from '@/components/workout/WorkoutGraph'
import { PurposeRibbon } from '@/components/workout/PurposeRibbon'
import { StepList } from '@/components/workout/StepList'
import { useWorkoutInteraction } from '@/components/workout/useWorkoutInteraction'
import { WorkoutActions } from '@/components/workout/WorkoutActions'
import { ComplianceSummary } from '@/components/workout/ComplianceSummary'
import { CoachSummary } from '@/components/workout/CoachSummary'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export default function WorkoutDetails() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const interaction = useWorkoutInteraction()
  const [viewMode, setViewMode] = useState<'planned' | 'actual'>('planned')

  const { data: workout, isLoading, error } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => {
      if (!workoutId) {
        throw new Error('Workout ID is required')
      }
      return getWorkout(workoutId)
    },
    enabled: !!workoutId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  const { data: timeline } = useAuthenticatedQuery({
    queryKey: ['workoutTimeline', workoutId],
    queryFn: () => {
      if (!workoutId) {
        throw new Error('Workout ID is required')
      }
      return getWorkoutTimeline(workoutId)
    },
    enabled: !!workoutId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  if (error || !workout) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-muted-foreground">
          <p>Unable to load workout</p>
          <p className="text-xs mt-2">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Workout — {workout.sport}</h1>
            <p className="text-muted-foreground mt-1 capitalize">Source: {workout.source}</p>
          </div>
          <WorkoutActions workoutId={workout.id} />
        </div>

        {timeline && timeline.segments.length > 0 && (
          <>
            <ComplianceSummary
              overallCompliancePercent={timeline.overall_compliance_percent ?? null}
              totalPausedSeconds={timeline.total_paused_seconds ?? null}
            />

            <CoachSummary
              verdict={timeline.coach_verdict ?? null}
              summary={timeline.coach_summary ?? null}
              confidence={timeline.llm_confidence ?? null}
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => {
                    if (value === 'planned' || value === 'actual') {
                      setViewMode(value)
                    }
                  }}
                >
                  <ToggleGroupItem value="planned" aria-label="Planned view">
                    Planned
                  </ToggleGroupItem>
                  <ToggleGroupItem value="actual" aria-label="Planned vs Actual view">
                    Planned vs Actual
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <WorkoutGraph
              timeline={timeline}
              activeStepOrder={interaction.activeStepOrder}
              onStepHover={interaction.setActiveStepOrder}
              showActual={viewMode === 'actual'}
            />

            <PurposeRibbon
              segments={timeline.segments}
              totalDurationSeconds={timeline.total_duration_seconds}
              activeStepOrder={interaction.activeStepOrder}
              onSelectStep={interaction.setActiveStepOrder}
            />
          </>
        )}

        <StepList
          steps={workout.steps}
          activeStepOrder={interaction.activeStepOrder}
          onSelectStep={interaction.setActiveStepOrder}
          timeline={timeline}
        />
      </div>
    </AppLayout>
  )
}
