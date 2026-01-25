import { useAuthenticatedQuery } from './useAuthenticatedQuery'
import { fetchStructuredWorkout, type StructuredWorkoutResponse } from '@/api/workouts'

export type StructuredWorkoutState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: StructuredWorkoutResponse }

export function useStructuredWorkout(workoutId: string | undefined) {
  const { data, isLoading, error, isFetching } = useAuthenticatedQuery<StructuredWorkoutResponse>({
    queryKey: ['structuredWorkout', workoutId],
    queryFn: () => {
      if (!workoutId) {
        throw new Error('Workout ID is required')
      }
      return fetchStructuredWorkout(workoutId)
    },
    enabled: !!workoutId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // If no workoutId, return ready with null data (not loading)
  if (!workoutId) {
    return { status: 'ready' as const, data: null }
  }

  if (isLoading || isFetching) {
    return { status: 'loading' as const }
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load structured workout'
    return { status: 'error' as const, error: errorMessage }
  }

  if (data) {
    return { status: 'ready' as const, data }
  }

  // If query completed but no data, return ready with null
  return { status: 'ready' as const, data: null }
}
