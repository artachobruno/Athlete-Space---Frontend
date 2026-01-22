import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getIntensityColor } from '@/lib/workoutIntensity'
import { useUnitSystem } from '@/hooks/useUnitSystem'
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

const STEP_TYPES = [
  { value: 'warmup', label: 'Warmup', intensity: 'easy' },
  { value: 'steady', label: 'Steady', intensity: 'steady' },
  { value: 'interval', label: 'Interval', intensity: 'vo2' },
  { value: 'recovery', label: 'Recovery', intensity: 'recovery' },
  { value: 'cooldown', label: 'Cooldown', intensity: 'easy' },
  { value: 'rest', label: 'Rest', intensity: 'rest' },
  { value: 'tempo', label: 'Tempo', intensity: 'tempo' },
  { value: 'threshold', label: 'Threshold', intensity: 'threshold' },
  { value: 'free', label: 'Free Run', intensity: 'flow' },
]

const TARGET_TYPES = [
  { value: 'pace', label: 'Pace' },
  { value: 'hr', label: 'Heart Rate' },
  { value: 'power', label: 'Power' },
  { value: 'rpe', label: 'RPE' },
]

export function StepEditorRow({ step, onUpdate, onDelete, errors }: StepEditorRowProps) {
  const { unitSystem, convertDistance } = useUnitSystem()
  
  const handleNameChange = (name: string) => {
    onUpdate({ ...step, name })
  }

  const handleTypeChange = (type: string) => {
    const stepType = STEP_TYPES.find(t => t.value === type)
    const intensity = stepType?.intensity || step.intensity || null
    onUpdate({ ...step, type, step_type: type, kind: type, intensity })
  }

  const handleDurationChange = (value: string) => {
    const seconds = value ? parseInt(value, 10) * 60 : null
    onUpdate({ ...step, duration_seconds: seconds, distance_meters: null })
  }

  const handleDistanceChange = (value: string) => {
    if (!value) {
      onUpdate({ ...step, distance_meters: null, duration_seconds: null })
      return
    }
    
    const distanceValue = parseFloat(value)
    if (isNaN(distanceValue)) {
      return
    }
    
    // Convert to meters based on unit system
    let meters: number
    if (unitSystem === 'imperial') {
      // Input is in miles, convert to meters
      meters = distanceValue * 1609.34
    } else {
      // Input is in km, convert to meters
      meters = distanceValue * 1000
    }
    
    // Calculate duration from distance and pace if pace target is set
    let calculatedDuration: number | null = null
    if (step.target?.type === 'pace' && step.target.value !== null && step.target.value !== undefined) {
      // Pace is in min/km, convert to seconds per meter
      const paceMinPerKm = step.target.value
      const paceSecPerMeter = (paceMinPerKm * 60) / 1000
      calculatedDuration = Math.round(meters * paceSecPerMeter)
    } else if (step.target?.type === 'pace' && step.target.min !== null && step.target.min !== undefined) {
      // Use min pace if available
      const paceMinPerKm = step.target.min
      const paceSecPerMeter = (paceMinPerKm * 60) / 1000
      calculatedDuration = Math.round(meters * paceSecPerMeter)
    }
    
    onUpdate({ 
      ...step, 
      distance_meters: meters, 
      duration_seconds: calculatedDuration || step.duration_seconds 
    })
  }

  const handleTargetTypeChange = (type: string) => {
    const normalizedType = type === '__none__' ? '' : type
    const unit = normalizedType === 'pace' ? 'min/km' : normalizedType === 'hr' ? 'bpm' : normalizedType === 'power' ? 'W' : 'RPE'
    onUpdate({
      ...step,
      target: {
        ...step.target,
        type: normalizedType || undefined,
        unit: normalizedType ? unit : undefined,
      },
      target_type: (normalizedType || null) as 'pace' | 'hr' | 'power' | null,
      target_metric: normalizedType || undefined,
    })
  }

  const handleTargetMinChange = (value: string) => {
    const min = value ? parseFloat(value) : null
    const updatedStep = {
      ...step,
      target: {
        ...step.target,
        min,
      },
      target_min: min ?? undefined,
    }
    
    // Recalculate duration if distance and pace are set
    if (step.distance_meters && step.target?.type === 'pace' && min !== null) {
      const paceSecPerMeter = (min * 60) / 1000
      const calculatedDuration = Math.round(step.distance_meters * paceSecPerMeter)
      updatedStep.duration_seconds = calculatedDuration
    }
    
    onUpdate(updatedStep)
  }

  const handleTargetMaxChange = (value: string) => {
    const max = value ? parseFloat(value) : null
    const updatedStep = {
      ...step,
      target: {
        ...step.target,
        max,
      },
      target_max: max ?? undefined,
    }
    
    // Recalculate duration if distance and pace are set (use min if available, otherwise max)
    if (step.distance_meters && step.target?.type === 'pace') {
      const paceValue = step.target.min ?? max
      if (paceValue !== null && paceValue !== undefined) {
        const paceSecPerMeter = (paceValue * 60) / 1000
        const calculatedDuration = Math.round(step.distance_meters * paceSecPerMeter)
        updatedStep.duration_seconds = calculatedDuration
      }
    }
    
    onUpdate(updatedStep)
  }

  const durationMinutes = step.duration_seconds ? Math.round(step.duration_seconds / 60) : ''
  
  // Convert distance to user's preferred unit for display
  let distanceDisplay = ''
  let distanceUnit = ''
  if (step.distance_meters) {
    const converted = convertDistance(step.distance_meters / 1000)
    distanceDisplay = converted.value.toFixed(2)
    distanceUnit = converted.unit
  }
  
  const rawTargetType = step.target?.type || step.target_type || ''
  const targetType = rawTargetType || '__none__'
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

      <div className="col-span-4">
        <Label htmlFor={`step-${step.id}-type`} className="text-xs">Type</Label>
        <Select value={step.type || step.step_type || step.kind || ''} onValueChange={handleTypeChange}>
          <SelectTrigger id={`step-${step.id}-type`} className="mt-1">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {STEP_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-3">
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

      <div className="col-span-3">
        <Label htmlFor={`step-${step.id}-distance`} className="text-xs">Distance ({distanceUnit || (unitSystem === 'imperial' ? 'mi' : 'km')})</Label>
        <Input
          id={`step-${step.id}-distance`}
          type="number"
          step="0.1"
          value={distanceDisplay}
          onChange={(e) => handleDistanceChange(e.target.value)}
          placeholder={unitSystem === 'imperial' ? 'Miles' : 'Kilometers'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor={`step-${step.id}-target-type`} className="text-xs">Target Type</Label>
            <Select value={targetType} onValueChange={handleTargetTypeChange}>
              <SelectTrigger id={`step-${step.id}-target-type`} className="mt-1">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {TARGET_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetType && targetType !== '__none__' && (
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
