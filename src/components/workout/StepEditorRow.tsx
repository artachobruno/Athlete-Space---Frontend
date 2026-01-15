import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getIntensityColor } from '@/lib/workoutIntensity'
import type { StructuredWorkoutStep } from '@/api/workouts'

interface StepEditorRowProps {
  step: StructuredWorkoutStep
  onUpdate: (step: StructuredWorkoutStep) => void
  onDelete: () => void
  errors?: {
    duration?: string
    distance?: string
    target?: string
  }
}

const STEP_KINDS = [
  { value: 'warmup', label: 'Warmup' },
  { value: 'steady', label: 'Steady' },
  { value: 'interval', label: 'Interval' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'cooldown', label: 'Cooldown' },
  { value: 'rest', label: 'Rest' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'free', label: 'Free Run' },
]

const INTENSITIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'rest', label: 'Rest' },
  { value: 'steady', label: 'Steady' },
  { value: 'tempo', label: 'Tempo' },
  { value: 'lt2', label: 'LT2' },
  { value: 'threshold', label: 'Threshold' },
  { value: 'vo2', label: 'VO2' },
  { value: 'flow', label: 'Flow' },
]

const TARGET_TYPES = [
  { value: 'pace', label: 'Pace' },
  { value: 'hr', label: 'Heart Rate' },
  { value: 'power', label: 'Power' },
  { value: 'rpe', label: 'RPE' },
]

export function StepEditorRow({ step, onUpdate, onDelete, errors }: StepEditorRowProps) {
  const handleNameChange = (name: string) => {
    onUpdate({ ...step, name })
  }

  const handleKindChange = (kind: string) => {
    onUpdate({ ...step, kind, type: kind })
  }

  const handleIntensityChange = (intensity: string) => {
    onUpdate({ ...step, intensity })
  }

  const handleDurationChange = (value: string) => {
    const seconds = value ? parseInt(value, 10) * 60 : null
    onUpdate({ ...step, duration_seconds: seconds, distance_meters: null })
  }

  const handleDistanceChange = (value: string) => {
    const meters = value ? parseFloat(value) * 1000 : null
    onUpdate({ ...step, distance_meters: meters, duration_seconds: null })
  }

  const handleTargetTypeChange = (type: string) => {
    const unit = type === 'pace' ? 'min/km' : type === 'hr' ? 'bpm' : type === 'power' ? 'W' : 'RPE'
    onUpdate({
      ...step,
      target: {
        ...step.target,
        type,
        unit,
      },
      target_type: type as 'pace' | 'hr' | 'power' | null,
      target_metric: type,
    })
  }

  const handleTargetMinChange = (value: string) => {
    const min = value ? parseFloat(value) : null
    onUpdate({
      ...step,
      target: {
        ...step.target,
        min,
      },
      target_min: min ?? undefined,
    })
  }

  const handleTargetMaxChange = (value: string) => {
    const max = value ? parseFloat(value) : null
    onUpdate({
      ...step,
      target: {
        ...step.target,
        max,
      },
      target_max: max ?? undefined,
    })
  }

  const durationMinutes = step.duration_seconds ? Math.round(step.duration_seconds / 60) : ''
  const distanceKm = step.distance_meters ? (step.distance_meters / 1000).toFixed(2) : ''
  const targetType = step.target?.type || step.target_type || ''
  const targetMin = step.target?.min ?? step.target_min ?? ''
  const targetMax = step.target?.max ?? step.target_max ?? ''

  return (
    <div className="grid grid-cols-12 gap-4 items-start p-4 border rounded-lg bg-card">
      <div className="col-span-1 flex items-center justify-center">
        <span className="text-sm font-medium text-muted-foreground">{step.order}</span>
      </div>

      <div className="col-span-2">
        <Label htmlFor={`step-${step.id}-name`} className="text-xs">Name</Label>
        <Input
          id={`step-${step.id}-name`}
          value={step.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Step name"
          className="mt-1"
        />
      </div>

      <div className="col-span-2">
        <Label htmlFor={`step-${step.id}-kind`} className="text-xs">Kind</Label>
        <Select value={step.kind || step.type} onValueChange={handleKindChange}>
          <SelectTrigger id={`step-${step.id}-kind`} className="mt-1">
            <SelectValue placeholder="Kind" />
          </SelectTrigger>
          <SelectContent>
            {STEP_KINDS.map((kind) => (
              <SelectItem key={kind.value} value={kind.value}>
                {kind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Label htmlFor={`step-${step.id}-intensity`} className="text-xs">Intensity</Label>
        <Select value={step.intensity || ''} onValueChange={handleIntensityChange}>
          <SelectTrigger id={`step-${step.id}-intensity`} className="mt-1">
            <SelectValue placeholder="Intensity" />
          </SelectTrigger>
          <SelectContent>
            {INTENSITIES.map((intensity) => (
              <SelectItem key={intensity.value} value={intensity.value}>
                {intensity.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-2">
        <Label htmlFor={`step-${step.id}-duration`} className="text-xs">Duration (min)</Label>
        <Input
          id={`step-${step.id}-duration`}
          type="number"
          value={durationMinutes}
          onChange={(e) => handleDurationChange(e.target.value)}
          placeholder="Minutes"
          className="mt-1"
          disabled={!!step.distance_meters}
        />
        {errors?.duration && (
          <p className="text-xs text-destructive mt-1">{errors.duration}</p>
        )}
      </div>

      <div className="col-span-2">
        <Label htmlFor={`step-${step.id}-distance`} className="text-xs">Distance (km)</Label>
        <Input
          id={`step-${step.id}-distance`}
          type="number"
          step="0.1"
          value={distanceKm}
          onChange={(e) => handleDistanceChange(e.target.value)}
          placeholder="Kilometers"
          className="mt-1"
          disabled={!!step.duration_seconds}
        />
        {errors?.distance && (
          <p className="text-xs text-destructive mt-1">{errors.distance}</p>
        )}
      </div>

      <div className="col-span-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Target section - full width below */}
      <div className="col-span-12 mt-2 pt-2 border-t">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label htmlFor={`step-${step.id}-target-type`} className="text-xs">Target Type</Label>
            <Select value={targetType} onValueChange={handleTargetTypeChange}>
              <SelectTrigger id={`step-${step.id}-target-type`} className="mt-1">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {TARGET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetType && (
            <>
              <div>
                <Label htmlFor={`step-${step.id}-target-min`} className="text-xs">Min</Label>
                <Input
                  id={`step-${step.id}-target-min`}
                  type="number"
                  step="0.1"
                  value={targetMin}
                  onChange={(e) => handleTargetMinChange(e.target.value)}
                  placeholder="Min"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor={`step-${step.id}-target-max`} className="text-xs">Max</Label>
                <Input
                  id={`step-${step.id}-target-max`}
                  type="number"
                  step="0.1"
                  value={targetMax}
                  onChange={(e) => handleTargetMaxChange(e.target.value)}
                  placeholder="Max"
                  className="mt-1"
                />
                {errors?.target && (
                  <p className="text-xs text-destructive mt-1">{errors.target}</p>
                )}
              </div>
              <div className="flex items-end">
                <span className="text-xs text-muted-foreground">
                  {step.target?.unit || (targetType === 'pace' ? 'min/km' : targetType === 'hr' ? 'bpm' : 'W')}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
