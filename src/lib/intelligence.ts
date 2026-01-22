import { api } from "./api";
import type { ApiError } from "./api";

export interface SeasonPhase {
  week_start: number;
  week_end: number;
  label: string;
  volume_range: {
    min: number;
    max: number;
    unit: string;
  };
}

export interface RaceMarker {
  week: number;
  label: string;
  type: "race" | "milestone" | "recovery";
}

export interface SeasonIntelligence {
  phases: SeasonPhase[];
  race_markers: RaceMarker[];
  explanation: string;
}

export interface WeeklyIntent {
  focus: string;
  volume_range: {
    min: number;
    max: number;
    unit: string;
  };
  intensity_density: string;
  key_session_count: number;
  explanation: string;
}

import type { CoachDecisionV2, DailyDecisionV1, CoachDecision } from '@/types/coachDecision';
import { isCoachDecisionV2 } from '@/types/coachDecision';
import { adaptLegacyDecision } from '@/lib/ai/adapters/adaptLegacyDecision';

/**
 * Legacy v1 format (deprecated, use CoachDecisionV2)
 * @deprecated Use CoachDecisionV2 instead
 */
export interface DailyDecision {
  recommendation: string;
  explanation: string;
  confidence: {
    score: number;
    explanation: string;
  };
}

export interface IntelligenceError {
  message: string;
  status?: number;
  code?: string;
}

const handleIntelligenceError = (error: unknown): IntelligenceError => {
  if (error && typeof error === "object" && "message" in error) {
    const apiError = error as ApiError;
    
    // Handle CORS errors specifically
    if (apiError.code === "ERR_NETWORK" || 
        (apiError.message && apiError.message.includes("CORS"))) {
      return {
        message: "Unable to connect to the intelligence service. The backend server may be down or not configured to allow requests from this domain.",
        status: apiError.status,
        code: apiError.code,
      };
    }
    
    return {
      message: apiError.message || "Failed to load intelligence",
      status: apiError.status,
      code: apiError.code,
    };
  }
  return {
    message: "An unexpected error occurred",
  };
};

/**
 * Get season intelligence (phases, race markers, explanation).
 * The backend handles authentication automatically via the Authorization header.
 */
export const getSeasonIntelligence = async (): Promise<SeasonIntelligence | null> => {
  try {
    const response = await api.get("/intelligence/season");
    const data = response as unknown as {
      id?: string;
      user_id?: string;
      athlete_id?: number;
      plan?: { goal?: string; target_date?: string; phases?: unknown[] };
      intent?: { week_start?: string; focus?: string; sessions?: unknown[] };
      decision?: { date?: string; recommendation?: string; rationale?: string; session?: unknown };
      version?: number;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    
    // Handle the response format from the API documentation
    // The response can be either the plan directly or wrapped in a structure
    if (data.plan) {
      // This is a plan response, extract what we need
      return {
        phases: (data.plan.phases as SeasonPhase[]) || [],
        race_markers: [],
        explanation: `Season plan for ${data.plan.goal || 'training'} targeting ${data.plan.target_date || 'future date'}`,
      };
    } else if (data.intent) {
      // This is a weekly intent response, not season
      return null;
    } else if (data.decision) {
      // This is a daily decision response, not season
      return null;
    }
    
    // Fallback: try to use response as-is
    return response as unknown as SeasonIntelligence;
  } catch (error) {
    console.error("[Intelligence] Failed to load season intelligence:", error);
    throw handleIntelligenceError(error);
  }
};

/**
 * Get weekly training intent.
 * The backend handles authentication automatically via the Authorization header.
 * 
 * @param weekStart Optional week start date in YYYY-MM-DD format. If not provided, uses current week.
 */
export const getWeekIntelligence = async (weekStart?: string): Promise<WeeklyIntent | null> => {
  try {
    const params = weekStart ? { week_start: weekStart } : undefined;
    const response = await api.get("/intelligence/week", { params });
    const data = response as unknown as {
      id?: string;
      user_id?: string;
      athlete_id?: number;
      intent?: {
        week_start?: string;
        focus?: string;
        sessions?: unknown[];
      };
      season_plan_id?: string;
      version?: number;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    
    // Extract the intent from the response
    if (data.intent) {
      return {
        focus: data.intent.focus || '',
        volume_range: { min: 0, max: 0, unit: 'hours' },
        intensity_density: '',
        key_session_count: Array.isArray(data.intent.sessions) ? data.intent.sessions.length : 0,
        explanation: '',
      };
    }
    
    // Fallback: try to use response as-is
    return response as unknown as WeeklyIntent;
  } catch (error) {
    const intelligenceError = handleIntelligenceError(error);
    // 503 means data isn't ready yet - this is expected, not an error
    // CORS/network errors are handled by the API interceptor, so we don't log them here
    if (intelligenceError.status !== 503 && intelligenceError.code !== "ERR_NETWORK") {
      console.error("[Intelligence] Failed to load week intelligence:", error);
    }
    throw intelligenceError;
  }
};

/**
 * Get daily decision recommendations.
 * The backend handles authentication automatically via the Authorization header.
 * 
 * Returns CoachDecisionV2 if available, falls back to v1 adapter if needed.
 * 
 * @param decisionDate Optional decision date in YYYY-MM-DD format. If not provided, uses today.
 */
export const getTodayIntelligence = async (decisionDate?: string): Promise<CoachDecision | null> => {
  try {
    const params = decisionDate ? { decision_date: decisionDate } : undefined;
    const response = await api.get("/intelligence/today", { params });
    const data = response as unknown as {
      id?: string;
      user_id?: string;
      athlete_id?: number;
      decision?: {
        date?: string;
        recommendation?: string;
        explanation?: string;
        confidence?: { score?: number; explanation?: string };
        session?: unknown;
        // v2 fields
        version?: string;
        primary_focus?: string;
        signals?: string[];
        recommended_focus?: string[];
      };
      version?: number;
      is_active?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    
    // Extract the decision from the response
    if (data.decision) {
      // Check if this is v2 format
      if (data.decision.version === 'coach_decision_v2') {
        const v2Decision: CoachDecisionV2 = {
          version: 'coach_decision_v2',
          decision: (data.decision.recommendation?.toUpperCase() as 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL') || 'PROCEED',
          primary_focus: data.decision.primary_focus || 'Execute today appropriately',
          confidence: typeof data.decision.confidence === 'object' && typeof data.decision.confidence?.score === 'number'
            ? data.decision.confidence.score
            : 0.8,
          signals: Array.isArray(data.decision.signals) && data.decision.signals.length > 0
            ? data.decision.signals
            : ['Based on current training state'],
          recommended_focus: Array.isArray(data.decision.recommended_focus) && data.decision.recommended_focus.length > 0
            ? data.decision.recommended_focus
            : ['Follow planned training'],
          explanation: data.decision.explanation,
        };
        
        // Validate v2 structure
        if (v2Decision.signals.length === 0) {
          console.warn('[CoachDecisionV2] Empty signals array, falling back to v1 adapter');
          // Fall through to v1 adapter
        } else if (v2Decision.confidence < 0 || v2Decision.confidence > 1) {
          console.warn('[CoachDecisionV2] Invalid confidence score, falling back to v1 adapter');
          // Fall through to v1 adapter
        } else {
          console.debug('[CoachDecisionV2]', {
            decision: v2Decision.decision,
            confidence: v2Decision.confidence,
            signalsCount: v2Decision.signals.length,
          });
          return v2Decision;
        }
      }
      
      // v1 format - adapt to v2
      const confidenceData = (data.decision as { confidence?: { score?: number; explanation?: string } }).confidence;
      
      const confidence: { score: number; explanation: string } = confidenceData && 
        typeof confidenceData.score === 'number' && 
        typeof confidenceData.explanation === 'string'
        ? {
            score: confidenceData.score,
            explanation: confidenceData.explanation,
          }
        : {
            score: 0.8,
            explanation: 'Based on current training state',
          };
      
      const v1Decision: DailyDecisionV1 = {
        recommendation: data.decision.recommendation || '',
        explanation: data.decision.explanation || data.decision.recommendation || '',
        confidence,
      };
      
      // Track legacy usage for monitoring
      console.debug('[CoachDecision] Using v1 adapter');
      
      // Adapt to v2
      return adaptLegacyDecision(v1Decision);
    }
    
    // Fallback: try to use response as-is (legacy)
    const fallback = response as unknown as DailyDecisionV1;
    if (fallback && fallback.recommendation && fallback.confidence) {
      return adaptLegacyDecision(fallback);
    }
    
    return null;
  } catch (error) {
    const intelligenceError = handleIntelligenceError(error);
    // 503 means data isn't ready yet - this is expected, not an error
    // CORS/network errors are handled by the API interceptor, so we don't log them here
    if (intelligenceError.status !== 503 && intelligenceError.code !== "ERR_NETWORK") {
      console.error("[Intelligence] Failed to load today intelligence:", error);
    }
    throw intelligenceError;
  }
};

