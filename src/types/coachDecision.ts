/**
 * Coach Decision v2 - Structured, schema-first decision format
 * 
 * This is the authoritative contract for AI coach decisions.
 * UI never depends on `explanation` - it's optional fallback only.
 */

export type CoachDecisionV2 = {
  version: 'coach_decision_v2';

  decision: 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL';

  primary_focus: string;

  confidence: number; // 0–1

  signals: string[]; // ordered, max 3–5

  recommended_focus: string[]; // ordered, actionable

  explanation?: string; // OPTIONAL fallback only
};

/**
 * Legacy v1 format (for backward compatibility)
 */
export interface DailyDecisionV1 {
  recommendation: string;
  explanation: string;
  confidence: {
    score: number;
    explanation: string;
  };
}

/**
 * Union type for decision data (supports both v1 and v2)
 */
export type CoachDecision = CoachDecisionV2 | DailyDecisionV1;

/**
 * Type guard to check if decision is v2
 */
export function isCoachDecisionV2(decision: CoachDecision): decision is CoachDecisionV2 {
  return 'version' in decision && decision.version === 'coach_decision_v2';
}
