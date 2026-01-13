import { api } from "@/lib/api"

export interface PlannerInput {
  message?: string
  sport?: string
  duration_minutes?: number
  distance_km?: number
  intensity?: string
  [key: string]: unknown
}

export interface PlannerResponse {
  workout_id: string
}

export async function createWorkoutFromPlanner(input: PlannerInput): Promise<PlannerResponse> {
  console.log("[API] Creating workout from planner:", input)
  try {
    const response = await api.post("/planner/run", input)
    return response as unknown as PlannerResponse
  } catch (error) {
    console.error("[API] Failed to create workout from planner:", error)
    throw error
  }
}
