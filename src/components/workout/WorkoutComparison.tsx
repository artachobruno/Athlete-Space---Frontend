import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { StructuredWorkoutStep, StructuredWorkoutComparison } from '@/api/workouts'

interface WorkoutComparisonProps {
  steps: StructuredWorkoutStep[]
  comparison: StructuredWorkoutComparison[]
  totalDistanceMeters: number | null
  totalDurationSeconds: number | null
}

const STATUS_COLORS = {
  hit: 'bg-green-500',
  short: 'bg-orange-500',
  over: 'bg-blue-500',
}

const STATUS_ICONS = {
  hit: CheckCircle2,
  short: AlertTriangle,
  over: TrendingUp,
}

export function WorkoutComparison({
  steps,
  comparison,
  totalDistanceMeters,
  totalDurationSeconds,
}: WorkoutComparisonProps) {

  const comparisonMap = useMemo(() => {
    const map = new Map<string, StructuredWorkoutComparison>()
    comparison.forEach((comp) => {
      map.set(comp.step_id, comp)
    })
    return map
  }, [comparison])

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

  if (!totalValue || sortedSteps.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Execution data unavailable</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Planned vs Executed</div>
      <div className="space-y-3">
        {sortedSteps.map((step) => {
          const comp = comparisonMap.get(step.id)
          if (!comp) return null

          const plannedValue =
            comp.planned_distance !== null
              ? comp.planned_distance
              : step.distance_meters !== null
                ? step.distance_meters
                : step.duration_seconds !== null
                  ? step.duration_seconds
                  : 0

          const executedValue = comp.executed_distance !== null ? comp.executed_distance : 0

          const plannedWidth = totalValue > 0 ? (plannedValue / totalValue) * 100 : 0
          const executedWidth = totalValue > 0 ? (executedValue / totalValue) * 100 : 0

          const StatusIcon = STATUS_ICONS[comp.status]
          const statusColor = STATUS_COLORS[comp.status]

          return (
            <div key={step.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Step {step.order}</span>
                <Badge variant="outline" className="gap-1">
                  <StatusIcon className={cn('h-3 w-3', statusColor.replace('bg-', 'text-'))} />
                  {comp.status === 'hit' && 'Hit'}
                  {comp.status === 'short' && 'Short'}
                  {comp.status === 'over' && 'Over'}
                  {comp.delta_pct !== null && ` (${comp.delta_pct > 0 ? '+' : ''}${comp.delta_pct.toFixed(1)}%)`}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="relative h-3 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary/30"
                    style={{ width: `${plannedWidth}%` }}
                    title="Planned"
                  />
                </div>
                <div className="relative h-3 bg-muted rounded overflow-hidden">
                  <div
                    className={cn('h-full', statusColor)}
                    style={{ width: `${executedWidth}%` }}
                    title="Executed"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
