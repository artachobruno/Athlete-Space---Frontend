import { api } from "@/lib/api"
import { isPreviewMode } from "@/lib/preview"
import { mockWorkouts, buildTimelineFromMockWorkout } from "@/mock/workouts.mock"
import type { Workout } from "@/types/workout"
import type { WorkoutTimeline } from "@/types/workoutTimeline"

export interface WorkoutTarget {
  type: string | null
  min: number | null
  max: number | null
  value: number | null
  unit: string | null
}

export interface StructuredWorkoutStep {
  id: string
  order: number
  name: string
  type: string
  step_type: string // Keep for backward compatibility
  kind: string | null
  intensity: string | null
  distance_meters: number | null
  duration_seconds: number | null
  target: WorkoutTarget | null
  target_type: "pace" | "hr" | "power" | null // Keep for backward compatibility
  target_low?: number // Keep for backward compatibility
  target_high?: number // Keep for backward compatibility
  target_metric?: string | null
  target_min?: number | null
  target_max?: number | null
  target_value?: number | null
  repeat_group_id: string | null
  instructions?: string | null
  purpose?: string | null
  inferred: boolean
}

export interface WorkoutStepGroup {
  group_id: string
  repeat: number
  step_ids: string[]
}

export interface StructuredWorkoutComparison {
  step_id: string
  planned_distance: number | null
  executed_distance: number | null
  delta_pct: number | null
  status: "hit" | "short" | "over"
}

export interface StructuredWorkoutResponse {
  workout: {
    id: string
    sport: "run" | "ride" | "swim"
    total_distance_meters: number | null
    total_duration_seconds: number | null
    parse_status: "pending" | "parsed" | "ambiguous" | "failed"
  }
  steps: StructuredWorkoutStep[]
  groups: WorkoutStepGroup[]
  structured_available: boolean
  comparison?: StructuredWorkoutComparison[]
}

export async function getWorkout(workoutId: string): Promise<Workout> {
  // Check if we're in preview mode
  if (isPreviewMode()) {
    console.log("[API] Preview mode: Returning mock workout:", workoutId)
    // Simulate network delay for realistic preview
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const workout = mockWorkouts.find(w => w.id === workoutId);
    if (!workout) {
      throw new Error(`Workout ${workoutId} not found in mock data`);
    }
    return workout;
  }
  
  console.log("[API] Fetching workout:", workoutId)
  try {
    const response = await api.get(`/workouts/${workoutId}`)
    return response as unknown as Workout
  } catch (error) {
    console.error("[API] Failed to fetch workout:", error)
    throw error
  }
}

export async function getWorkoutTimeline(
  workoutId: string
): Promise<WorkoutTimeline> {
  // Check if we're in preview mode
  if (isPreviewMode()) {
    console.log("[API] Preview mode: Returning mock workout timeline:", workoutId)
    // Simulate network delay for realistic preview
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const timeline = buildTimelineFromMockWorkout(workoutId);
    if (!timeline) {
      throw new Error(`Workout timeline ${workoutId} not found in mock data`);
    }
    return timeline;
  }
  
  console.log("[API] Fetching workout timeline:", workoutId)
  try {
    const response = await api.get(`/workouts/${workoutId}/timeline`)
    return response as unknown as WorkoutTimeline
  } catch (error) {
    console.error("[API] Failed to fetch workout timeline:", error)
    throw error
  }
}

export interface WorkoutExport {
  id: string
  status: "queued" | "building" | "ready" | "failed"
  download_url?: string
  error?: string
}

export async function createWorkoutExport(
  workoutId: string
): Promise<WorkoutExport> {
  console.log("[API] Creating workout export:", workoutId)
  try {
    const response = await api.post(`/workouts/${workoutId}/exports`, {
      export_type: "fit",
    })
    return response as unknown as WorkoutExport
  } catch (error) {
    console.error("[API] Failed to create workout export:", error)
    throw error
  }
}

export async function getWorkoutExportStatus(
  workoutId: string,
  exportId: string
): Promise<WorkoutExport> {
  console.log("[API] Fetching workout export status:", workoutId, exportId)
  try {
    const response = await api.get(`/workouts/${workoutId}/exports/${exportId}`)
    return response as unknown as WorkoutExport
  } catch (error) {
    console.error("[API] Failed to fetch workout export status:", error)
    throw error
  }
}

export async function fetchStructuredWorkout(
  workoutId: string
): Promise<StructuredWorkoutResponse> {
  console.log("[API] Fetching structured workout:", workoutId)
  const response = await api.get(`/workouts/${workoutId}/structured`)
  return response as unknown as StructuredWorkoutResponse
}

export async function updateWorkoutSteps(
  workoutId: string,
  steps: StructuredWorkoutStep[]
): Promise<StructuredWorkoutResponse> {
  console.log("[API] Updating workout steps:", workoutId, steps.length)
  const response = await api.put(`/workouts/${workoutId}/steps`, { steps })
  return response as unknown as StructuredWorkoutResponse
}
