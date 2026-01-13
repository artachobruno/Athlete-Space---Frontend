export type TimelineTarget = {
  metric?: "pace" | "hr" | "power" | "rpe"
  min?: number
  max?: number
  value?: number
}

export type WorkoutTimelineSegment = {
  step_id: string
  order: number
  step_type: string

  start_second: number
  end_second: number

  target: TimelineTarget
  purpose?: string
  compliance_percent?: number
  coach_feedback?: string
  coach_tip?: string
}

export type ActualDataPoint = {
  time_second: number
  value: number
}

export type WorkoutStreams = {
  time: number[]        // seconds from start
  hr?: (number | null)[]
  pace?: (number | null)[]
  power?: (number | null)[]
  cadence?: (number | null)[]
}

export type WorkoutTimeline = {
  workout_id: string
  total_duration_seconds: number
  segments: WorkoutTimelineSegment[]
  streams?: WorkoutStreams
  overall_compliance_percent?: number
  total_paused_seconds?: number
  actual_data?: ActualDataPoint[]
  coach_verdict?: string
  coach_summary?: string
  llm_confidence?: number
}
