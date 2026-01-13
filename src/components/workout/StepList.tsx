import { useMemo, useRef, useEffect } from 'react'
import type { WorkoutStep } from '@/types/workout'
import type { WorkoutTimeline } from '@/types/workoutTimeline'
import { useUnitSystem } from '@/hooks/useUnitSystem'
import { StepComplianceBadge } from './StepComplianceBadge'
import { StepCoachFeedback } from './StepCoachFeedback'

type StepListProps = {
  steps: WorkoutStep[]
  activeStepOrder: number | null
  onSelectStep: (order: number) => void
  timeline?: WorkoutTimeline | null
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60)
  return `${minutes} min`
}

function formatDistance(meters: number, convertDistance: (km: number) => { value: number; unit: string }): string {
  const km = meters / 1000
  const converted = convertDistance(km)
  return `${converted.value.toFixed(1)} ${converted.unit}`
}

function formatTargetMetric(step: WorkoutStep, convertPace: (minPerKm: number) => { value: number; unit: string }): string | null {
  if (!step.target_metric) return null

  if (step.target_metric === 'pace') {
    if (step.target_min && step.target_max) {
      const minConverted = convertPace(step.target_min)
      const maxConverted = convertPace(step.target_max)
      return `${minConverted.value.toFixed(2)}–${maxConverted.value.toFixed(2)} ${minConverted.unit}`
    }
    if (step.target_value) {
      const converted = convertPace(step.target_value)
      return `${converted.value.toFixed(2)} ${converted.unit}`
    }
  }

  if (step.target_metric === 'hr') {
    if (step.target_min && step.target_max) {
      return `${step.target_min}–${step.target_max} bpm`
    }
    if (step.target_value) {
      return `${step.target_value} bpm`
    }
  }

  if (step.target_metric === 'power') {
    if (step.target_min && step.target_max) {
      return `${step.target_min}–${step.target_max} W`
    }
    if (step.target_value) {
      return `${step.target_value} W`
    }
  }

  if (step.target_metric === 'rpe') {
    if (step.target_min && step.target_max) {
      return `${step.target_min}–${step.target_max}`
    }
    if (step.target_value) {
      return `${step.target_value}`
    }
  }

  return null
}

export function StepList({ steps, activeStepOrder, onSelectStep, timeline }: StepListProps) {
  const { convertDistance, convertPace } = useUnitSystem()
  const activeStepRef = useRef<HTMLDivElement>(null)

  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.order - b.order)
  }, [steps])

  const complianceMap = useMemo(() => {
    if (!timeline) return new Map<number, number | null>()
    const map = new Map<number, number | null>()
    timeline.segments.forEach(seg => {
      map.set(seg.order, seg.compliance_percent ?? null)
    })
    return map
  }, [timeline])

  const feedbackMap = useMemo(() => {
    if (!timeline) return new Map<number, { feedback?: string | null; tip?: string | null; stepType: string }>()
    const map = new Map<number, { feedback?: string | null; tip?: string | null; stepType: string }>()
    timeline.segments.forEach(seg => {
      map.set(seg.order, {
        feedback: seg.coach_feedback ?? null,
        tip: seg.coach_tip ?? null,
        stepType: seg.step_type,
      })
    })
    return map
  }, [timeline])

  useEffect(() => {
    if (activeStepOrder !== null && activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeStepOrder])

  return (
    <div className="space-y-2">
      {sortedSteps.map((step) => {
        const isActive = activeStepOrder === step.order
        const targetStr = formatTargetMetric(step, convertPace)
        const compliancePercent = complianceMap.get(step.order) ?? null
        const feedbackData = feedbackMap.get(step.order)

        return (
          <div
            key={step.id}
            ref={isActive ? activeStepRef : null}
            className={`
              border rounded-lg p-4 space-y-2 cursor-pointer
              transition-all duration-200
              ${isActive 
                ? 'border-primary bg-primary/5 shadow-md' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
            onClick={() => onSelectStep(step.order)}
            onMouseEnter={() => onSelectStep(step.order)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`
                  font-semibold text-lg
                  ${isActive ? 'text-primary' : 'text-foreground'}
                `}>
                  {step.order}.
                </span>
                <span className={`
                  font-semibold capitalize
                  ${isActive ? 'text-primary' : 'text-foreground'}
                `}>
                  {step.type}
                </span>
                {step.inferred && (
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    (Inferred)
                  </span>
                )}
              </div>
              <StepComplianceBadge
                compliancePercent={compliancePercent}
                stepType={step.type}
              />
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              {step.duration_seconds && (
                <div>{formatDuration(step.duration_seconds)}</div>
              )}
              {step.distance_meters && (
                <div>{formatDistance(step.distance_meters, convertDistance)}</div>
              )}
              {targetStr && (
                <div className="font-medium">
                  Target: {targetStr}
                </div>
              )}
              {step.instructions && (
                <div>{step.instructions}</div>
              )}
              {step.purpose && (
                <div className="text-xs italic">Purpose: {step.purpose}</div>
              )}
            </div>

            {feedbackData && (
              <div className="mt-2 pt-2 border-t border-border">
                <StepCoachFeedback
                  compliancePercent={compliancePercent}
                  stepType={feedbackData.stepType}
                  feedback={feedbackData.feedback}
                  tip={feedbackData.tip}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
