import { useAuthenticatedQuery } from './useAuthenticatedQuery'
import { fetchStructuredWorkout, type StructuredWorkoutResponse } from '@/api/workouts'

export type StructuredWorkoutState =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: StructuredWorkoutResponse }

export function useStructuredWorkout(workoutId: string | undefined) {
  const { data, isLoading, error } = useAuthenticatedQuery<StructuredWorkoutResponse>({
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

  if (isLoading) {
    return { status: 'loading' as const }
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load structured workout'
    return { status: 'error' as const, error: errorMessage }
  }

  if (data) {
    return { status: 'ready' as const, data }
  }

  return { status: 'loading' as const }
}
