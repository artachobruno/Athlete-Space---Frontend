export type StepStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export interface CoachStep {
  id: string;
  label: string;
}

export interface ProgressEvent {
  step_id: string;
  status: StepStatus;
  timestamp: string;
  message?: string;
}

export interface CoachProgressResponse {
  steps: CoachStep[];
  events: ProgressEvent[];
}
