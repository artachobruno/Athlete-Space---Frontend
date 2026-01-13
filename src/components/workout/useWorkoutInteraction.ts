import { useState } from 'react'

export function useWorkoutInteraction() {
  const [activeStepOrder, setActiveStepOrder] = useState<number | null>(null)

  return {
    activeStepOrder,
    setActiveStepOrder,
  }
}
