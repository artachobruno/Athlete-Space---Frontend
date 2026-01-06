import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { auth } from "./auth";

const getBaseURL = () => {
  if (import.meta.env.PROD) {
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
    // Debug: Log the API URL being used (only in dev or if URL seems wrong)
    if (import.meta.env.DEV || !import.meta.env.VITE_API_URL) {
      console.log("[API] Using base URL:", apiUrl);
    }
    return apiUrl;
  }
  return "http://localhost:8000";
};

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
}

// Calendar types
export interface CalendarSession {
  id: string;
  date: string;
  time: string | null;
  type: string;
  title: string;
  duration_minutes: number | null;
  distance_km: number | null;
  intensity: string | null;
  status: "planned" | "completed" | "skipped" | "cancelled";
  notes: string | null;
}

export interface TodayResponse {
  date: string;
  sessions: CalendarSession[];
}

export interface WeekResponse {
  week_start: string;
  week_end: string;
  sessions: CalendarSession[];
}

export interface SeasonResponse {
  season_start: string;
  season_end: string;
  sessions: CalendarSession[];
  total_sessions: number;
  completed_sessions: number;
  planned_sessions: number;
}

// Activity streams types
export interface StreamsData {
  time?: number[];
  latlng?: number[][];
  heartrate?: number[];
  distance?: number[];
  altitude?: number[];
  velocity_smooth?: number[];
  cadence?: number[];
  watts?: number[];
  grade_smooth?: number[];
  temp?: number[];
}

export interface ActivityStreamsResponse {
  success?: boolean;
  streams_data?: StreamsData | null;
  message?: string;
}

// Axios instance configured for CORS
// - withCredentials: true enables sending cookies/credentials with cross-origin requests
// - Backend CORS is configured to allow requests from https://pace-ai.onrender.com
export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Required for CORS with credentials
  timeout: 30000,
});

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  
  if (import.meta.env.PROD) {
    const backendUrl = import.meta.env.VITE_API_URL;
    if (backendUrl && backendUrl.startsWith("http")) {
      return `${backendUrl}${cleanPath}`;
    }
    return cleanPath;
  }
  return `/api${cleanPath}`;
};

export const getStravaConnectUrl = (): string => {
  const backendUrl = import.meta.env.VITE_API_URL;
  
  if (backendUrl && backendUrl.startsWith("http")) {
    return `${backendUrl}/auth/strava`;
  }
  
  const isProduction = import.meta.env.PROD || window.location.hostname !== "localhost";
  
  if (isProduction) {
    const apiBase = api.defaults.baseURL;
    if (typeof apiBase === "string" && apiBase.startsWith("http")) {
      return `${apiBase}/auth/strava`;
    }
    return "/auth/strava";
  }
  
  return "/api/auth/strava";
};

/**
 * Initiates Strava OAuth connection.
 * Fetches OAuth URL from backend and redirects to Strava.
 */
export const initiateStravaConnect = async (): Promise<void> => {
  console.log("[API] Initiating Strava connect");
  
  try {
    // Use axios instance which has proper baseURL and CORS configuration
    const response = await api.get("/auth/strava") as unknown as { redirect_url?: string; oauth_url?: string; url?: string };
    
    const oauthUrl = response.redirect_url || response.oauth_url || response.url;
    
    if (!oauthUrl) {
      throw new Error("Backend did not return OAuth URL");
    }

    console.log("[API] Redirecting to Strava OAuth URL");
    window.location.href = oauthUrl;
  } catch (error) {
    console.error("[API] Failed to initiate Strava connect:", error);
    throw error;
  }
};

/**
 * Disconnects Strava integration.
 */
export const disconnectStrava = async (): Promise<void> => {
  console.log("[API] Disconnecting Strava");
  try {
    await api.post("/auth/strava/disconnect");
  } catch (error) {
    console.error("[API] Failed to disconnect Strava:", error);
    throw error;
  }
};

/**
 * Fetches user profile from the backend.
 * @returns Profile data including onboarding status and source information
 */
export const fetchUserProfile = async (): Promise<import("../types").AthleteProfile> => {
  console.log("[API] Fetching user profile");
  try {
    const response = await api.get("/me/profile");
    return response as unknown as import("../types").AthleteProfile;
  } catch (error) {
    console.error("[API] Failed to fetch profile:", error);
    throw error;
  }
};

/**
 * Updates user profile on the backend.
 * @param profileData - Partial profile data to update
 * @returns Updated profile data
 */
export const updateUserProfile = async (
  profileData: Partial<import("../types").AthleteProfile>
): Promise<import("../types").AthleteProfile> => {
  console.log("[API] Updating user profile");
  try {
    const response = await api.put("/me/profile", profileData);
    return response as unknown as import("../types").AthleteProfile;
  } catch (error) {
    console.error("[API] Failed to update profile:", error);
    throw error;
  }
};

/**
 * Gets Strava integration status.
 */
export const getStravaStatus = async (): Promise<{ connected: boolean; athlete_id?: string | number }> => {
  console.log("[API] Fetching Strava status");
  try {
    const response = await api.get("/integrations/strava/status");
    return response as unknown as { connected: boolean; athlete_id?: string | number };
  } catch (error) {
    console.error("[API] Failed to fetch Strava status:", error);
    throw error;
  }
};

/**
 * Fetches activities from the backend.
 * Note: Backend has a maximum limit of 100. Larger limits will be capped at 100.
 */
export const fetchActivities = async (params?: { limit?: number; offset?: number }): Promise<import("../types").CompletedActivity[]> => {
  console.log("[API] Fetching activities with params:", params);
  try {
    // Ensure limit doesn't exceed backend maximum of 100
    const safeParams = params ? {
      ...params,
      limit: params.limit && params.limit > 100 ? 100 : params.limit,
    } : params;
    
    const response = await api.get("/activities", { params: safeParams });
    console.log("[API] Activities response:", response);
    
    let activitiesArray: unknown[] = [];
    
    // Handle different response formats
    if (Array.isArray(response)) {
      activitiesArray = response;
    } else if (response && typeof response === "object") {
      // If response is an object, try to extract the array
      const activities = (response as { activities?: unknown[]; data?: unknown[]; items?: unknown[] }).activities 
        || (response as { activities?: unknown[]; data?: unknown[]; items?: unknown[] }).data
        || (response as { activities?: unknown[]; data?: unknown[]; items?: unknown[] }).items;
      
      if (Array.isArray(activities)) {
        activitiesArray = activities;
      }
    }
    
    // Filter out invalid/empty activities
    const validActivities = activitiesArray.filter((activity): activity is import("../types").CompletedActivity => {
      if (!activity || typeof activity !== 'object') {
        return false;
      }
      const act = activity as { id?: string; title?: string; date?: string; sport?: string };
      
      // Must have an ID
      if (!act.id || typeof act.id !== 'string') {
        return false;
      }
      
      // Must have a date
      if (!act.date || typeof act.date !== 'string') {
        return false;
      }
      
      // Must have a sport
      if (!act.sport || typeof act.sport !== 'string') {
        return false;
      }
      
      // Filter out obvious mock/placeholder data
      const title = act.title?.toLowerCase() || '';
      if (title.includes('placeholder') || title.includes('mock') || title.includes('sample') || title === 'untitled activity') {
        return false;
      }
      
      return true;
    });
    
    console.log(`[API] Filtered ${validActivities.length} valid activities from ${activitiesArray.length} total`);
    
    if (validActivities.length === 0 && activitiesArray.length > 0) {
      console.warn("[API] All activities were filtered out. Raw response:", response);
    }
    
    return validActivities;
  } catch (error) {
    console.error("[API] Failed to fetch activities:", error);
    throw error;
  }
};

/**
 * Fetches a single activity by ID.
 */
export const fetchActivity = async (id: string): Promise<import("../types").CompletedActivity> => {
  console.log("[API] Fetching activity", id);
  try {
    const response = await api.get(`/activities/${id}`);
    return response as unknown as import("../types").CompletedActivity;
  } catch (error) {
    console.error("[API] Failed to fetch activity:", error);
    throw error;
  }
};

/**
 * Fetches activity streams (GPS, heart rate, power, etc.).
 */
export const fetchActivityStreams = async (id: string): Promise<ActivityStreamsResponse> => {
  console.log("[API] Fetching activity streams", id);
  try {
    const response = await api.post(`/activities/${id}/fetch-streams`);
    return response as unknown as ActivityStreamsResponse;
  } catch (error) {
    console.error("[API] Failed to fetch activity streams:", error);
    throw error;
  }
};

/**
 * Fetches training overview data.
 */
export const fetchOverview = async (days?: number): Promise<{
  today: { ctl: number; atl: number; tsb: number };
  metrics: {
    ctl?: [string, number][];
    atl?: [string, number][];
    tsb?: [string, number][];
  };
}> => {
  console.log("[API] Fetching overview");
  try {
    const response = await api.get("/me/overview", { params: days ? { days } : undefined });
    return response as unknown as {
      today: { ctl: number; atl: number; tsb: number };
      metrics: {
        ctl?: [string, number][];
        atl?: [string, number][];
        tsb?: [string, number][];
      };
    };
  } catch (error) {
    console.error("[API] Failed to fetch overview:", error);
    throw error;
  }
};

/**
 * Fetches coach summary.
 */
export const fetchCoachSummary = async (): Promise<{
  insights?: string[];
  risk_level?: string;
  recommendations?: string[];
}> => {
  console.log("[API] Fetching coach summary");
  try {
    const response = await api.get("/coach/summary");
    return response as unknown as {
      insights?: string[];
      risk_level?: string;
      recommendations?: string[];
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach summary:", error);
    throw error;
  }
};

/**
 * Sends a chat message to the coach.
 */
export const sendCoachChat = async (message: string, context?: unknown): Promise<{ reply?: string; intent?: string }> => {
  console.log("[API] Sending coach chat message");
  try {
    const payload: { message: string; context?: unknown } = { message };
    if (context) {
      payload.context = context;
    }
    const response = await api.post("/coach/chat", payload);
    return response as unknown as { reply?: string; intent?: string };
  } catch (error) {
    console.error("[API] Failed to send coach chat:", error);
    throw error;
  }
};

/**
 * Fetches calendar week data.
 */
export const fetchCalendarWeek = async (date: string): Promise<WeekResponse> => {
  console.log("[API] Fetching calendar week for date:", date);
  try {
    const response = await api.get("/calendar/week", { params: { date } });
    console.log("[API] Calendar week response:", response);
    
    // Handle different response formats
    if (response && typeof response === 'object') {
      // If response already has the expected structure
      if ('sessions' in response && Array.isArray(response.sessions)) {
        return response as WeekResponse;
      }
      // If response is wrapped in a data property
      if ('data' in response && response.data && typeof response.data === 'object') {
        const data = response.data as { sessions?: unknown[]; week_start?: string; week_end?: string };
        if (data.sessions && Array.isArray(data.sessions)) {
          return {
            week_start: data.week_start || '',
            week_end: data.week_end || '',
            sessions: data.sessions as CalendarSession[],
          };
        }
      }
    }
    
    // Fallback: return empty structure if response doesn't match
    console.warn("[API] Calendar week response doesn't match expected format:", response);
    return {
      week_start: date,
      week_end: date,
      sessions: [],
    };
  } catch (error) {
    console.error("[API] Failed to fetch calendar week:", error);
    throw error;
  }
};

/**
 * Fetches calendar today data.
 */
export const fetchCalendarToday = async (date: string): Promise<TodayResponse> => {
  console.log("[API] Fetching calendar today");
  try {
    const response = await api.get("/calendar/today", { params: { date } });
    return response as unknown as TodayResponse;
  } catch (error) {
    console.error("[API] Failed to fetch calendar today:", error);
    throw error;
  }
};

/**
 * Fetches calendar season data.
 */
export const fetchCalendarSeason = async (): Promise<SeasonResponse> => {
  console.log("[API] Fetching calendar season");
  try {
    const response = await api.get("/calendar/season");
    console.log("[API] Calendar season response:", response);
    
    // Handle different response formats
    if (response && typeof response === 'object') {
      // If response already has the expected structure
      if ('sessions' in response && Array.isArray(response.sessions)) {
        return response as SeasonResponse;
      }
      // If response is wrapped in a data property
      if ('data' in response && response.data && typeof response.data === 'object') {
        const data = response.data as { sessions?: unknown[]; season_start?: string; season_end?: string; total_sessions?: number; completed_sessions?: number; planned_sessions?: number };
        if (data.sessions && Array.isArray(data.sessions)) {
          return {
            season_start: data.season_start || '',
            season_end: data.season_end || '',
            sessions: data.sessions as CalendarSession[],
            total_sessions: data.total_sessions || 0,
            completed_sessions: data.completed_sessions || 0,
            planned_sessions: data.planned_sessions || 0,
          };
        }
      }
    }
    
    // Fallback: return empty structure if response doesn't match
    console.warn("[API] Calendar season response doesn't match expected format:", response);
    return {
      season_start: new Date().toISOString().split('T')[0],
      season_end: new Date().toISOString().split('T')[0],
      sessions: [],
      total_sessions: 0,
      completed_sessions: 0,
      planned_sessions: 0,
    };
  } catch (error) {
    console.error("[API] Failed to fetch calendar season:", error);
    throw error;
  }
};

/**
 * Triggers Strava data aggregation.
 */
export const aggregateStravaData = async (): Promise<void> => {
  console.log("[API] Aggregating Strava data");
  try {
    await api.post("/strava/aggregate");
  } catch (error) {
    console.error("[API] Failed to aggregate Strava data:", error);
    throw error;
  }
};

/**
 * Triggers Strava data sync.
 */
export const syncStravaData = async (): Promise<void> => {
  console.log("[API] Syncing Strava data");
  try {
    await api.post("/strava/sync");
  } catch (error) {
    console.error("[API] Failed to sync Strava data:", error);
    throw error;
  }
};

const normalizeError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string | unknown[]; message?: string | unknown[]; error?: string | unknown[] }>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    const extractMessage = (value: unknown): string => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map((item) => {
          if (typeof item === "string") {
            return item;
          }
          if (item && typeof item === "object" && "msg" in item) {
            return String(item.msg);
          }
          return String(item);
        }).join(", ");
      }
      if (value && typeof value === "object" && "msg" in value) {
        return String(value.msg);
      }
      return String(value);
    };
    
    let message = "An unexpected error occurred";
    
    // First, try to extract error message from response data
    if (data?.detail) {
      message = extractMessage(data.detail);
    } else if (data?.message) {
      message = extractMessage(data.message);
    } else if (data?.error) {
      message = extractMessage(data.error);
    } else if (axiosError.code === "ECONNABORTED" || (axiosError.message && axiosError.message.includes("timeout"))) {
      message = "Request timed out. Please try again.";
    } else if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
      const requestUrl = axiosError.config?.url || axiosError.request?.responseURL || "";
      const isCrossOrigin = requestUrl && !requestUrl.startsWith(window.location.origin);
      
      if (isCrossOrigin && axiosError.message && axiosError.message.includes("CORS") || 
          (typeof axiosError.request !== "undefined" && axiosError.request.status === 0)) {
        message = "Network error: Unable to connect to the backend server. This may be a temporary connectivity issue.";
      } else {
        message = "Network error. Please check your connection and ensure the backend server is running.";
      }
    } else if (status === 401) {
      message = "Authentication required. Please log in.";
    } else if (status === 403) {
      message = "You don't have permission to perform this action.";
    } else if (status === 404) {
      message = "Resource not found.";
    } else if (status === 500) {
      message = "Server error. Please try again later.";
    } else if (axiosError.message) {
      message = axiosError.message;
    }
    
    return {
      message,
      status,
      code: axiosError.code,
      details: data,
    };
  }
  
  if (error instanceof Error) {
    return {
      message: error.message,
      details: error,
    };
  }
  
  return {
    message: "An unknown error occurred",
    details: error,
  };
};

// Request interceptor: Adds Authorization header for authenticated requests
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      const token = auth.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Content-Type is set automatically by axios for JSON requests
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we've already logged a CORS error to avoid console spam
let corsErrorLogged = false;

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const normalizedError = normalizeError(error);
    
    // Handle 401 by clearing auth and redirecting
    if (normalizedError.status === 401) {
      auth.clear();
      window.location.href = "/";
      return Promise.reject(normalizedError);
    }
    
    // 503 means service unavailable / data not ready - this is expected, not an error
    if (normalizedError.status === 503) {
      // Don't log 503 errors - they're expected when data isn't ready yet
      return Promise.reject(normalizedError);
    }
    
    // CORS/network errors - should be rare now that backend CORS is configured
    // Log them for debugging but don't spam the console
    if (normalizedError.code === "ERR_NETWORK" || 
        (normalizedError.message && normalizedError.message.includes("CORS"))) {
      // Log once per session to help identify any remaining CORS issues
      if (!corsErrorLogged) {
        console.warn("[API] CORS/Network error detected. If this persists, check backend CORS configuration.");
        corsErrorLogged = true;
      }
    } else {
      // Log other errors normally (but not 503)
      console.error("[API] Request failed:", normalizedError);
    }
    
    return Promise.reject(normalizedError);
  }
);

