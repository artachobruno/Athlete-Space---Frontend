import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { StructuredWorkoutStep } from '@/api/workouts'

interface WorkoutTimelineProps {
  steps: StructuredWorkoutStep[]
  totalDistanceMeters: number | null
  totalDurationSeconds: number | null
}

const STEP_COLORS: Record<StructuredWorkoutStep['step_type'], string> = {
  warmup: '#A3E635',
  steady: '#60A5FA',
  interval: '#F97316',
  cooldown: '#38BDF8',
  rest: '#CBD5E1',
}

export function WorkoutTimeline({
  steps,
  totalDistanceMeters,
  totalDurationSeconds,
}: WorkoutTimelineProps) {
  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.order - b.order)
  }, [steps])

  const totalValue = useMemo(() => {
    if (totalDistanceMeters !== null) {
      return totalDistanceMeters
    }
    if (totalDurationSeconds !== null) {
      return totalDurationSeconds
    }
    return null
  }, [totalDistanceMeters, totalDurationSeconds])

  const axisLabel = useMemo(() => {
    if (totalDistanceMeters !== null) {
      return 'Distance'
    }
    if (totalDurationSeconds !== null) {
      return 'Time'
    }
    return null
  }, [totalDistanceMeters, totalDurationSeconds])

  if (!totalValue || sortedSteps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No timeline data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {axisLabel && (
        <div className="text-xs font-medium text-muted-foreground">
          {axisLabel}
        </div>
      )}
      <div className="flex items-center gap-1 h-12 rounded-lg overflow-hidden">
        {sortedSteps.map((step) => {
          const stepValue =
            step.distance_meters !== null
              ? step.distance_meters
              : step.duration_seconds !== null
                ? step.duration_seconds
                : 0

          const widthPercent = totalValue > 0 ? (stepValue / totalValue) * 100 : 0
          const color = STEP_COLORS[step.step_type] || STEP_COLORS.steady

          return (
            <div
              key={step.id}
              className={cn('h-full flex items-center justify-center transition-all')}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: color,
                minWidth: widthPercent > 0 ? '2px' : '0',
              }}
              title={`${step.step_type} - Step ${step.order}`}
            />
          )
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Start</span>
        <span>End</span>
      </div>
    </div>
  )
}
