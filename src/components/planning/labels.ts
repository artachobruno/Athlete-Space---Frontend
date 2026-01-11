export const PHASE_LABELS: Record<string, string> = {
  plan_spec: "Defining training goal",
  week_skeleton: "Creating weekly structure",
  time_allocation: "Allocating training time",
  week_validation: "Validating plan",
  week_assembly: "Assembling weekly plan",
  template_selection: "Choosing workouts",
  materialization: "Finalizing sessions",
  materialization_validation: "Final checks",
  execution: "Scheduling calendar",
};

export const labelForPhase = (phase: string): string =>
  PHASE_LABELS[phase] ?? phase;
