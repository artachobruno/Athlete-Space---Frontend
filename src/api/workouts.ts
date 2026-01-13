import { api } from "@/lib/api"
import type { Workout } from "@/types/workout"
import type { WorkoutTimeline } from "@/types/workoutTimeline"

export async function getWorkout(workoutId: string): Promise<Workout> {
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
