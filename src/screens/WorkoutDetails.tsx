import { useState } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { useParams } from 'react-router-dom'
import { Loader2, Edit2, X } from 'lucide-react'
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout'
import { useQueryClient } from '@tanstack/react-query'
import { WorkoutHeader } from '@/components/workout/WorkoutHeader'
import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline'
import { WorkoutComparison } from '@/components/workout/WorkoutComparison'
import { WorkoutStepsTable } from '@/components/workout/WorkoutStepsTable'
import { StructuredWorkoutEditor } from '@/components/workout/StructuredWorkoutEditor'
import { ParseStatusBanner } from '@/components/workout/ParseStatusBanner'
import { WorkoutExport } from '@/components/workout/WorkoutExport'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateWorkoutSteps } from '@/api/workouts'
import { toast } from '@/hooks/use-toast'
import type { StructuredWorkoutStep } from '@/api/workouts'

export default function WorkoutDetails() {
  const { workoutId } = useParams<{ workoutId: string }>()
  const state = useStructuredWorkout(workoutId)
  const queryClient = useQueryClient()
  const [editMode, setEditMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
  const { workout, steps, groups = [], structured_available, comparison } = data

  const handleSave = async (updatedSteps: StructuredWorkoutStep[]) => {
    if (!workoutId) return

    setIsSaving(true)
    try {
      const response = await updateWorkoutSteps(workoutId, updatedSteps)
      
      // Invalidate and refetch the structured workout query
      await queryClient.invalidateQueries({ queryKey: ['structuredWorkout', workoutId] })
      
      // Update local state immediately for better UX
      queryClient.setQueryData(['structuredWorkout', workoutId], {
        status: 'ready',
        data: response,
      })

      toast({
        title: 'Workout updated',
        description: 'Steps have been saved successfully.',
      })

      setEditMode(false)
    } catch (error) {
      console.error('Failed to save steps:', error)
      toast({
        title: 'Failed to save',
        description: error instanceof Error ? error.message : 'An error occurred while saving steps.',
        variant: 'destructive',
      })
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditMode(false)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <WorkoutHeader workout={workout} />
          <div className="flex items-center gap-2">
            {structured_available && steps.length > 0 && !editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Steps
              </Button>
            )}
            {editMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <WorkoutExport workoutId={workout.id} />
          </div>
        </div>

        {!structured_available && steps.length === 0 && (
          <ParseStatusBanner parseStatus={workout.parse_status} />
        )}

        {structured_available && steps.length > 0 && !editMode && (
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

        {editMode && structured_available && steps.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <StructuredWorkoutEditor
                steps={steps}
                onSave={handleSave}
                onCancel={handleCancel}
                isSaving={isSaving}
              />
            </CardContent>
          </Card>
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
      </div>
    </AppLayout>
  )
}
