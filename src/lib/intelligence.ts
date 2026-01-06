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
 * Get athlete_id from Strava status endpoint.
 * This is needed because the intelligence endpoints require athlete_id as a query parameter.
 */
const getAthleteId = async (): Promise<number | null> => {
  try {
    const statusResponse = await api.get("/integrations/strava/status") as unknown as {
      athlete_id?: string | number;
      connected?: boolean | string;
    };
    
    if (!statusResponse?.connected) {
      return null;
    }
    
    const athleteId = statusResponse.athlete_id;
    if (!athleteId) {
      return null;
    }
    
    // Convert to number if it's a string
    const athleteIdNum = typeof athleteId === "string" ? parseInt(athleteId, 10) : athleteId;
    if (isNaN(athleteIdNum)) {
      return null;
    }
    
    return athleteIdNum;
  } catch (error) {
    console.error("[Intelligence] Failed to get athlete_id:", error);
    return null;
  }
};

export const getSeasonIntelligence = async (): Promise<SeasonIntelligence | null> => {
  try {
    const athleteId = await getAthleteId();
    if (!athleteId) {
      throw new Error("Athlete ID not available. Please connect your Strava account.");
    }
    
    const response = await api.get(`/intelligence/season?athlete_id=${athleteId}`);
    return response as unknown as SeasonIntelligence;
  } catch (error) {
    console.error("[Intelligence] Failed to load season intelligence:", error);
    throw handleIntelligenceError(error);
  }
};

export const getWeekIntelligence = async (): Promise<WeeklyIntent | null> => {
  try {
    const athleteId = await getAthleteId();
    if (!athleteId) {
      throw new Error("Athlete ID not available. Please connect your Strava account.");
    }
    
    const response = await api.get(`/intelligence/week?athlete_id=${athleteId}`);
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

export const getTodayIntelligence = async (): Promise<DailyDecision | null> => {
  try {
    const athleteId = await getAthleteId();
    if (!athleteId) {
      throw new Error("Athlete ID not available. Please connect your Strava account.");
    }
    
    const response = await api.get(`/intelligence/today?athlete_id=${athleteId}`);
    return response as unknown as DailyDecision;
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

