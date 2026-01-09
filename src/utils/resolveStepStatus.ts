import type { ProgressEvent, StepStatus } from '@/types/coachProgress';

/**
 * Computes the current status of a step from its events.
 * Returns the status of the most recent event, or "planned" if no events exist.
 */
export function resolveStepStatus(
  stepId: string,
  events: ProgressEvent[]
): StepStatus {
  const relevant = events.filter((e) => e.step_id === stepId);
  if (relevant.length === 0) return "planned";
  return relevant[relevant.length - 1].status;
}
