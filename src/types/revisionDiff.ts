/** Types for plan revision diffs. */

export type FieldChange = {
  field: string;
  before: unknown;
  after: unknown;
};

export type SessionFieldDiff = {
  session_id: string;
  changes: FieldChange[];
};

export type SessionDiff = {
  session_id: string;
  date: string;
  type: string;
  title: string | null;
};

export type PlanDiff = {
  scope: "day" | "week" | "plan";
  added: SessionDiff[];
  removed: SessionDiff[];
  modified: SessionFieldDiff[];
  unchanged: string[]; // session_ids
};

export type PlanRevision = {
  id: string;
  revision_type: string;
  status: "applied" | "blocked" | "pending";
  reason: string | null;
  blocked_reason: string | null;
  affected_start: string | null; // ISO date string
  affected_end: string | null; // ISO date string
  deltas: {
    diff?: PlanDiff;
    [key: string]: unknown;
  } | null;
  created_at: string; // ISO datetime string
  applied: boolean;
  applied_at: string | null; // ISO datetime string
  approved_by_user: boolean | null;
  requires_approval: boolean;
  confidence: number | null; // 0.0-1.0
  parent_revision_id: string | null;
};
