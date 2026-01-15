import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { StepEditorRow } from './StepEditorRow'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GlassCard } from '@/components/ui/glass-card'
import type { StructuredWorkoutStep } from '@/api/workouts'

interface StructuredWorkoutEditorProps {
  steps: StructuredWorkoutStep[]
  onSave: (steps: StructuredWorkoutStep[]) => Promise<void>
  onCancel: () => void
  isSaving?: boolean
}

interface SortableStepRowProps {
  step: StructuredWorkoutStep
  onUpdate: (step: StructuredWorkoutStep) => void
  onDelete: () => void
  errors?: {
    duration?: string
    distance?: string
    target?: string
  }
}

function SortableStepRow({ step, onUpdate, onDelete, errors }: SortableStepRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-8 cursor-grab active:cursor-grabbing">
        <div {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <StepEditorRow
        step={step}
        onUpdate={onUpdate}
        onDelete={onDelete}
        errors={errors}
      />
    </div>
  )
}

export function StructuredWorkoutEditor({
  steps: initialSteps,
  onSave,
  onCancel,
  isSaving = false,
}: StructuredWorkoutEditorProps) {
  const [draftSteps, setDraftSteps] = useState<StructuredWorkoutStep[]>(() => {
    // Deep clone and ensure all steps have proper structure
    return initialSteps.map((step, index) => ({
      ...step,
      order: index + 1, // Ensure order is sequential
    }))
  })

  const [errors, setErrors] = useState<Record<string, { duration?: string; distance?: string; target?: string }>>({})

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setDraftSteps((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newSteps = arrayMove(items, oldIndex, newIndex)
        
        // Update order fields
        return newSteps.map((step, index) => ({
          ...step,
          order: index + 1,
        }))
      })
    }
  }

  const handleStepUpdate = (updatedStep: StructuredWorkoutStep) => {
    setDraftSteps((steps) =>
      steps.map((step) => (step.id === updatedStep.id ? updatedStep : step))
    )
    
    // Clear errors for this step
    setErrors((prev) => {
      const next = { ...prev }
      delete next[updatedStep.id]
      return next
    })
  }

  const handleStepDelete = (stepId: string) => {
    setDraftSteps((steps) => {
      const newSteps = steps.filter((step) => step.id !== stepId)
      // Reorder remaining steps
      return newSteps.map((step, index) => ({
        ...step,
        order: index + 1,
      }))
    })
    
    // Clear errors for deleted step
    setErrors((prev) => {
      const next = { ...prev }
      delete next[stepId]
      return next
    })
  }

  const validateSteps = (): boolean => {
    const newErrors: Record<string, { duration?: string; distance?: string; target?: string }> = {}

    for (const step of draftSteps) {
      const stepErrors: { duration?: string; distance?: string; target?: string } = {}

      // Must have either duration or distance
      if (!step.duration_seconds && !step.distance_meters) {
        stepErrors.duration = 'Must have either duration or distance'
        stepErrors.distance = 'Must have either duration or distance'
      }

      // Target validation
      if (step.target) {
        if (step.target.min !== null && step.target.max !== null) {
          if (step.target.min > step.target.max) {
            stepErrors.target = 'Min cannot be greater than max'
          }
        }
      } else if (step.target_min !== undefined && step.target_max !== undefined) {
        if (step.target_min > step.target_max) {
          stepErrors.target = 'Min cannot be greater than max'
        }
      }

      if (Object.keys(stepErrors).length > 0) {
        newErrors[step.id] = stepErrors
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateSteps()) {
      return
    }

    try {
      await onSave(draftSteps)
    } catch (error) {
      console.error('Failed to save steps:', error)
      // Error handling is done by parent component
    }
  }

  const hasErrors = Object.keys(errors).length > 0

  return (
    <div className="space-y-4">
      <GlassCard variant="blue" className="rounded-xl p-6 space-y-4">
        <Alert>
          <AlertDescription>
            Editing steps directly. Groups are recalculated automatically after saving.
          </AlertDescription>
        </Alert>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={draftSteps.map((step) => step.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {draftSteps.map((step) => (
                <SortableStepRow
                  key={step.id}
                  step={step}
                  onUpdate={handleStepUpdate}
                  onDelete={() => handleStepDelete(step.id)}
                  errors={errors[step.id]}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {draftSteps.length === 0 && (
          <Alert>
            <AlertDescription>
              No steps remaining. Add steps or cancel to restore.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {hasErrors && (
              <span className="text-destructive">
                Please fix errors before saving
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || hasErrors || draftSteps.length === 0}>
              {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </GlassCard>
    </div>
    </div>
  )
}
