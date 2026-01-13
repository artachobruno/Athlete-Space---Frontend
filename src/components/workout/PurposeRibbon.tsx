import { useMemo } from 'react'
import type { WorkoutTimelineSegment } from '@/types/workoutTimeline'

type PurposeRibbonProps = {
  segments: WorkoutTimelineSegment[]
  totalDurationSeconds: number
  activeStepOrder: number | null
  onSelectStep: (order: number) => void
}

export function PurposeRibbon({ segments, totalDurationSeconds, activeStepOrder, onSelectStep }: PurposeRibbonProps) {
  const sortedSegments = useMemo(() => {
    return [...segments].sort((a, b) => a.order - b.order)
  }, [segments])

  const getWidthPercent = (segment: WorkoutTimelineSegment): number => {
    const duration = segment.end_second - segment.start_second
    return (duration / totalDurationSeconds) * 100
  }

  const getLabel = (segment: WorkoutTimelineSegment): string => {
    if (segment.purpose) {
      return segment.purpose
    }
    return segment.step_type
  }

  return (
    <div className="w-full border rounded-lg p-2 bg-card">
      <div className="flex h-12 items-stretch gap-0.5">
        {sortedSegments.map((segment) => {
          const isActive = activeStepOrder === segment.order
          const widthPercent = getWidthPercent(segment)
          const label = getLabel(segment)

          return (
            <button
              key={segment.step_id}
              type="button"
              onClick={() => onSelectStep(segment.order)}
              className={`
                relative flex items-center justify-center px-1 text-xs font-medium
                transition-all duration-200
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-md z-10' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              style={{ width: `${widthPercent}%` }}
              title={label}
            >
              <span className="truncate text-center">{label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
