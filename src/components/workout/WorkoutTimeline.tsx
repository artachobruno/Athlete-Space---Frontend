import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { StructuredWorkoutStep } from '@/api/workouts'

interface WorkoutTimelineProps {
  steps: StructuredWorkoutStep[]
  totalDistanceMeters: number | null
  totalDurationSeconds: number | null
}

const STEP_COLORS: Record<string, string> = {
  warmup: '#A3E635',
  steady: '#60A5FA',
  interval: '#F97316',
  cooldown: '#38BDF8',
  rest: '#CBD5E1',
  tempo: '#F59E0B',
  threshold: '#EF4444',
  recovery: '#10B981',
  easy: '#84CC16',
  long: '#8B5CF6',
  repeat_block: '#EC4899',
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

  // Calculate intensity multipliers for proportional heights
  const intensityMultipliers = useMemo(() => {
    const multipliers: Record<string, number> = {
      rest: 0.3,
      recovery: 0.4,
      easy: 0.5,
      flow: 0.6,
      warmup: 0.6,
      steady: 0.7,
      tempo: 0.8,
      cooldown: 0.5,
      lt2: 0.9,
      threshold: 1.0,
      interval: 0.95,
      vo2: 1.0,
      long: 0.7,
      repeat_block: 0.85,
    }
    return multipliers
  }, [])

  // Calculate target-based height multipliers
  const getHeightMultiplier = (step: StructuredWorkoutStep): number => {
    // If target value exists, use it to calculate relative intensity
    if (step.target?.value !== null && step.target?.value !== undefined) {
      // Normalize target value based on target type
      const targetValue = step.target.value
      if (step.target.type === 'pace') {
        // For pace, lower is faster/harder - inverse relationship
        // Use a reference pace (e.g., 4 min/km = 240s/km = 0.24 m/s)
        // This is a simplified calculation
        return Math.min(1.0, Math.max(0.3, 1.0 - (targetValue - 2.0) / 4.0))
      }
      if (step.target.type === 'power') {
        // For power, higher is harder
        // Assume FTP around 250W, normalize to 0.3-1.0 range
        return Math.min(1.0, Math.max(0.3, targetValue / 300.0))
      }
      if (step.target.type === 'hr') {
        // For HR, higher is harder
        // Assume threshold HR around 170, normalize to 0.3-1.0 range
        return Math.min(1.0, Math.max(0.3, targetValue / 200.0))
      }
    }

    // If target range exists, use the midpoint
    if (
      step.target?.min !== null &&
      step.target?.min !== undefined &&
      step.target?.max !== null &&
      step.target?.max !== undefined
    ) {
      const midpoint = (step.target.min + step.target.max) / 2
      if (step.target.type === 'pace') {
        return Math.min(1.0, Math.max(0.3, 1.0 - (midpoint - 2.0) / 4.0))
      }
      if (step.target.type === 'power') {
        return Math.min(1.0, Math.max(0.3, midpoint / 300.0))
      }
      if (step.target.type === 'hr') {
        return Math.min(1.0, Math.max(0.3, midpoint / 200.0))
      }
    }

    // Fallback to intensity-based multiplier
    const intensity = step.intensity?.toLowerCase() || step.step_type?.toLowerCase() || 'steady'
    return intensityMultipliers[intensity] || 0.7
  }

  // Calculate max multiplier for normalization
  const maxMultiplier = useMemo(() => {
    if (sortedSteps.length === 0) return 1.0
    return Math.max(...sortedSteps.map(step => getHeightMultiplier(step)), 0.3)
  }, [sortedSteps])

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
      <div className="flex items-end gap-1 h-12 rounded-lg overflow-hidden">
        {sortedSteps.map((step) => {
          const stepValue =
            (step.distance_meters !== null && step.distance_meters !== undefined)
              ? step.distance_meters
              : (step.duration_seconds !== null && step.duration_seconds !== undefined)
                ? step.duration_seconds
                : 0

          const widthPercent = totalValue > 0 ? (stepValue / totalValue) * 100 : 0
          const color = STEP_COLORS[step.step_type] || STEP_COLORS.steady || '#60A5FA'
          
          // Calculate proportional height based on target/intensity
          const multiplier = getHeightMultiplier(step)
          const normalizedHeight = maxMultiplier > 0 ? (multiplier / maxMultiplier) : 1.0
          const heightPercent = Math.max(30, normalizedHeight * 100) // Minimum 30% height

          return (
            <div
              key={step.id}
              className={cn('flex items-center justify-center transition-all')}
              style={{
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
                backgroundColor: color,
                minWidth: widthPercent > 0 ? '2px' : '0',
                minHeight: '30%',
              }}
              title={`${step.name || step.step_type} - Step ${step.order}`}
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
