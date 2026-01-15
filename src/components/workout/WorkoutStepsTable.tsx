import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useUnitSystem } from '@/hooks/useUnitSystem'
import type { StructuredWorkoutStep } from '@/api/workouts'

interface WorkoutStepsTableProps {
  steps: StructuredWorkoutStep[]
}

const STEP_TYPE_LABELS: Record<string, string> = {
  warmup: 'Warmup',
  steady: 'Steady',
  interval: 'Interval',
  cooldown: 'Cooldown',
  rest: 'Rest',
  tempo: 'Tempo',
  threshold: 'Threshold',
  recovery: 'Recovery',
  easy: 'Easy',
  long: 'Long',
  repeat_block: 'Repeat',
}

export function WorkoutStepsTable({ steps }: WorkoutStepsTableProps) {
  const { convertDistance, formatDistance } = useUnitSystem()

  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatTarget = (step: StructuredWorkoutStep): string => {
    if (!step.target_type) return 'N/A'
    const unit = step.target_type === 'pace' ? 'min/km' : step.target_type === 'hr' ? 'bpm' : 'W'
    if (step.target_low !== undefined && step.target_high !== undefined) {
      return `${step.target_low}-${step.target_high} ${unit}`
    }
    if (step.target_low !== undefined) {
      return `≥${step.target_low} ${unit}`
    }
    if (step.target_high !== undefined) {
      return `≤${step.target_high} ${unit}`
    }
    return step.target_type || 'N/A'
  }

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Step #</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Distance / Duration</TableHead>
            <TableHead>Target</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSteps.map((step) => (
            <TableRow key={step.id}>
              <TableCell className="font-medium">{step.order}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  {step.name || STEP_TYPE_LABELS[step.step_type] || (step.step_type ? step.step_type.charAt(0).toUpperCase() + step.step_type.slice(1) : 'Step')}
                </Badge>
              </TableCell>
              <TableCell>
                {(step.distance_meters !== null && step.distance_meters !== undefined) ? (
                  <span>{formatDistance(convertDistance(step.distance_meters / 1000))}</span>
                ) : (step.duration_seconds !== null && step.duration_seconds !== undefined) ? (
                  <span>{formatDuration(step.duration_seconds)}</span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">{formatTarget(step)}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
