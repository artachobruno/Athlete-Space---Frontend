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
  // These represent relative intensity, with more differentiation between zones
  const intensityMultipliers = useMemo(() => {
    const multipliers: Record<string, number> = {
      rest: 0.25,
      recovery: 0.35,
      easy: 0.45,
      flow: 0.55,
      warmup: 0.50,
      steady: 0.65,
      tempo: 0.75,
      cooldown: 0.40,
      lt2: 0.85,
      threshold: 0.95,
      interval: 0.90,
      vo2: 1.0,
      long: 0.60,
      repeat_block: 0.80,
    }
    return multipliers
  }, [])

  // Calculate target-based height multipliers
  const getHeightMultiplier = (step: StructuredWorkoutStep): number => {
    // Check both nested target object and direct fields
    const targetType = step.target?.type || step.target_metric
    const targetValue = step.target?.value ?? step.target_value
    const targetMin = step.target?.min ?? step.target_min
    const targetMax = step.target?.max ?? step.target_max

    // If target value exists, use it to calculate relative intensity
    if (targetValue !== null && targetValue !== undefined) {
      if (targetType === 'pace') {
        // For pace (in m/s), faster pace = lower value = higher intensity
        // Typical threshold pace: 3.33 m/s (5:00/km), easy: 2.5 m/s (6:40/km)
        // Invert: higher intensity = lower pace value
        // Normalize: 2.0 m/s (8:20/km) = 0.3, 4.0 m/s (4:10/km) = 1.0
        const normalized = 1.0 - ((targetValue - 2.0) / 2.0)
        return Math.min(1.0, Math.max(0.3, normalized))
      }
      if (targetType === 'power') {
        // For power, higher is harder
        // Normalize: 100W = 0.3, 300W = 1.0
        return Math.min(1.0, Math.max(0.3, (targetValue - 100) / 200))
      }
      if (targetType === 'hr') {
        // For HR, higher is harder
        // Normalize: 120 bpm = 0.3, 200 bpm = 1.0
        return Math.min(1.0, Math.max(0.3, (targetValue - 120) / 80))
      }
    }

    // If target range exists, use the midpoint
    if (
      targetMin !== null &&
      targetMin !== undefined &&
      targetMax !== null &&
      targetMax !== undefined
    ) {
      const midpoint = (targetMin + targetMax) / 2
      if (targetType === 'pace') {
        const normalized = 1.0 - ((midpoint - 2.0) / 2.0)
        return Math.min(1.0, Math.max(0.3, normalized))
      }
      if (targetType === 'power') {
        return Math.min(1.0, Math.max(0.3, (midpoint - 100) / 200))
      }
      if (targetType === 'hr') {
        return Math.min(1.0, Math.max(0.3, (midpoint - 120) / 80))
      }
    }

    // Fallback to intensity-based multiplier
    const intensity = step.intensity?.toLowerCase() || step.step_type?.toLowerCase() || 'steady'
    return intensityMultipliers[intensity] || 0.7
  }

  // Calculate min and max multipliers for better height differentiation
  const { minMultiplier, maxMultiplier } = useMemo(() => {
    if (sortedSteps.length === 0) return { minMultiplier: 0.3, maxMultiplier: 1.0 }
    const multipliers = sortedSteps.map(step => getHeightMultiplier(step))
    return {
      minMultiplier: Math.min(...multipliers, 0.3),
      maxMultiplier: Math.max(...multipliers, 1.0),
    }
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
          // Normalize to full range (min to max) for better visual differentiation
          const range = maxMultiplier - minMultiplier
          const normalizedHeight = range > 0 
            ? ((multiplier - minMultiplier) / range) 
            : 1.0
          // Map to 40-100% height range for better visibility
          const heightPercent = 40 + (normalizedHeight * 60) // 40% to 100%

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
