export type WorkoutStep = {
  id: string
  order: number
  type: string

  duration_seconds?: number
  distance_meters?: number

  target_metric?: "pace" | "hr" | "power" | "rpe"
  target_min?: number
  target_max?: number
  target_value?: number

  instructions?: string
  purpose?: string
  inferred: boolean
}

export type Workout = {
  id: string
  sport: string
  source: "planner" | "upload" | "manual"

  total_duration_seconds?: number
  total_distance_meters?: number

  steps: WorkoutStep[]
}
