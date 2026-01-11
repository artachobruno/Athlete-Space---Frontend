export type PlanningPhase =
  | "plan_spec"
  | "week_skeleton"
  | "time_allocation"
  | "week_validation"
  | "week_assembly"
  | "template_selection"
  | "materialization"
  | "materialization_validation"
  | "execution";

export interface PlanningProgressEvent {
  phase: PlanningPhase;
  status: "started" | "completed";
  percent_complete: number;
  message: string;
  summary?: Record<string, unknown>;
}
