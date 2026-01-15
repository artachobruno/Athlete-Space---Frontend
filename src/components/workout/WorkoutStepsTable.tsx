import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUnitSystem } from '@/hooks/useUnitSystem'
import { getIntensityColor } from '@/lib/workoutIntensity'
import type { StructuredWorkoutStep, WorkoutStepGroup } from '@/api/workouts'

interface WorkoutStepsTableProps {
  steps: StructuredWorkoutStep[]
  groups?: WorkoutStepGroup[]
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

export function WorkoutStepsTable({ steps, groups = [] }: WorkoutStepsTableProps) {
  const { convertDistance, formatDistance } = useUnitSystem()
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped')

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
    // Prefer new target object, fallback to legacy fields
    if (step.target) {
      const { type, min, max, value, unit } = step.target
      if (!type) return 'N/A'
      const targetUnit = unit || (type === 'pace' ? 'min/km' : type === 'hr' ? 'bpm' : 'W')
      if (min !== null && max !== null) {
        return `${min}-${max} ${targetUnit}`
      }
      if (min !== null) {
        return `≥${min} ${targetUnit}`
      }
      if (max !== null) {
        return `≤${max} ${targetUnit}`
      }
      if (value !== null) {
        return `${value} ${targetUnit}`
      }
    }
    
    // Legacy fallback
    if (step.target_type) {
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
    }
    
    return 'N/A'
  }

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)
  
  // Build step ID to group mapping
  const stepIdToGroup = new Map<string, WorkoutStepGroup>()
  for (const group of groups) {
    for (const stepId of group.step_ids) {
      stepIdToGroup.set(stepId, group)
    }
  }

  // Render grouped view
  if (viewMode === 'grouped' && groups.length > 0) {
    const processedStepIds = new Set<string>()
    const rows: Array<{ type: 'group' | 'step'; data: WorkoutStepGroup | StructuredWorkoutStep }> = []

    for (const step of sortedSteps) {
      if (processedStepIds.has(step.id)) continue

      const group = stepIdToGroup.get(step.id)
      if (group) {
        // Add group header
        rows.push({ type: 'group', data: group })
        
        // Get all steps in this group, sorted by order
        const groupSteps = group.step_ids
          .map(id => sortedSteps.find(s => s.id === id))
          .filter((s): s is StructuredWorkoutStep => s !== undefined)
          .sort((a, b) => a.order - b.order)
        
        // Show first 2 iterations of the pattern (or all if less than 2)
        const iterationsToShow = Math.min(2, group.repeat)
        const patternLength = groupSteps.length
        
        for (let i = 0; i < iterationsToShow; i++) {
          for (const groupStep of groupSteps) {
            // Find the step at this iteration
            const baseOrder = groupStep.order
            const stepAtIteration = sortedSteps.find(
              s => s.order === baseOrder + (i * patternLength) && group.step_ids.includes(s.id)
            )
            if (stepAtIteration) {
              rows.push({ type: 'step', data: stepAtIteration })
              processedStepIds.add(stepAtIteration.id)
            }
          }
        }
        
        // Mark all steps in group as processed
        group.step_ids.forEach(id => processedStepIds.add(id))
      } else {
        rows.push({ type: 'step', data: step })
        processedStepIds.add(step.id)
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Workout Steps</h3>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              Grouped
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('flat')}
            >
              All Steps
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Step #</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Distance / Duration</TableHead>
                <TableHead>Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => {
                if (row.type === 'group') {
                  const group = row.data as WorkoutStepGroup
                  const groupSteps = group.step_ids
                    .map(id => sortedSteps.find(s => s.id === id))
                    .filter((s): s is StructuredWorkoutStep => s !== undefined)
                    .sort((a, b) => a.order - b.order)
                  const groupNames = groupSteps.map(s => s.name || s.step_type || 'Step')
                  
                  return (
                    <TableRow key={`group-${group.group_id}`} className="bg-muted/50">
                      <TableCell colSpan={4} className="font-semibold">
                        {group.repeat}× ({groupNames.join(' + ')})
                      </TableCell>
                    </TableRow>
                  )
                } else {
                  const step = row.data as StructuredWorkoutStep
                  return (
                    <TableRow key={step.id}>
                      <TableCell className="font-medium">{step.order}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`${getIntensityColor(step.intensity || step.step_type).bg} ${getIntensityColor(step.intensity || step.step_type).text} ${getIntensityColor(step.intensity || step.step_type).border}`}
                        >
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
                  )
                }
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Flat view (all steps)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Workout Steps</h3>
        {groups.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
            >
              Grouped
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('flat')}
            >
              All Steps
            </Button>
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Step #</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Distance / Duration</TableHead>
              <TableHead>Target</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSteps.map((step) => (
              <TableRow key={step.id}>
                <TableCell className="font-medium">{step.order}</TableCell>
                <TableCell>
                  <Badge 
                    variant="outline"
                    className={`${getIntensityColor(step.intensity || step.step_type).bg} ${getIntensityColor(step.intensity || step.step_type).text} ${getIntensityColor(step.intensity || step.step_type).border}`}
                  >
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
    </div>
  )
}
