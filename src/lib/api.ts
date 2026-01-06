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
  time: number[]; // Time in seconds from start
  route_points: number[][]; // GPS coordinates [[lat, lng], ...]
  elevation: number[]; // Elevation in meters
  pace: (number | null)[]; // Pace in min/km (null when stopped)
  heartrate?: number[]; // Heart rate in bpm (if available)
  distance: number[]; // Cumulative distance in meters
  power?: number[]; // Power in watts (if available)
  cadence?: number[]; // Cadence in rpm (if available)
  data_points: number; // Total number of data points
}

export interface ActivityStreamsResponse extends StreamsData {}

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
    
    // Log first activity to see structure
    if (activitiesArray.length > 0) {
      console.log('[API] Sample activity structure:', activitiesArray[0]);
      console.log('[API] Activity keys:', Object.keys(activitiesArray[0] as Record<string, unknown>));
    }
    
    // First, remove duplicates by strava_activity_id (keep the first occurrence)
    const seenStravaIds = new Set<string | number>();
    let duplicateCount = 0;
    const uniqueActivities = activitiesArray.filter((activity) => {
      if (!activity || typeof activity !== 'object') {
        return false;
      }
      const act = activity as Record<string, unknown>;
      const stravaId = act.strava_activity_id;
      
      // If we've seen this Strava activity ID before, skip it
      if (stravaId !== undefined && stravaId !== null) {
        const idStr = String(stravaId);
        if (seenStravaIds.has(idStr)) {
          duplicateCount++;
          return false; // Duplicate
        }
        seenStravaIds.add(idStr);
      }
      
      return true;
    });
    
    if (duplicateCount > 0) {
      console.log(`[API] Removed ${duplicateCount} duplicate activities (by strava_activity_id)`);
    }
    
    // Map backend activity format to frontend format
    const validActivities = uniqueActivities
      .filter((activity) => {
        if (!activity || typeof activity !== 'object') {
          return false;
        }
        const act = activity as Record<string, unknown>;
        
        // Must have an ID
        if (!act.id || typeof act.id !== 'string') {
          return false;
        }
        
        // Must have a date (try multiple possible field names)
        const dateField = act.start_time || act.date || act.start_date || act.start_date_local || act.activity_date;
        if (!dateField || (typeof dateField !== 'string' && !(dateField instanceof Date))) {
          return false;
        }
        
        // Must have a sport/type (try multiple possible field names)
        const sportField = act.sport || act.type || act.activity_type || act.sport_type;
        if (!sportField || typeof sportField !== 'string') {
          return false;
        }
        
        // Filter out obvious mock/placeholder data
        const title = (act.title || act.name || act.activity_name || '').toString().toLowerCase();
        if (title.includes('placeholder') || title.includes('mock') || title.includes('sample')) {
          return false;
        }
        
        return true;
      })
      .map((activity) => {
        const act = activity as Record<string, unknown>;
        
        // Map backend fields to frontend format
        const dateField = act.start_time || act.date || act.start_date || act.start_date_local || act.activity_date || '';
        const sportField = act.type || act.sport || act.activity_type || act.sport_type || '';
        const titleField = act.title || act.name || act.activity_name || `${sportField} Activity`;
        
        // Normalize date
        let dateStr = '';
        if (typeof dateField === 'string') {
          dateStr = dateField.split('T')[0];
        } else if (dateField instanceof Date) {
          dateStr = dateField.toISOString().split('T')[0];
        } else {
          dateStr = String(dateField);
        }
        
        // Normalize sport to match frontend types
        const normalizedSport = sportField.toLowerCase();
        let sport: 'running' | 'cycling' | 'swimming' | 'triathlon' = 'running';
        if (normalizedSport.includes('run')) {
          sport = 'running';
        } else if (normalizedSport.includes('ride') || normalizedSport.includes('bike') || normalizedSport.includes('cycle')) {
          sport = 'cycling';
        } else if (normalizedSport.includes('swim')) {
          sport = 'swimming';
        } else if (normalizedSport.includes('tri')) {
          sport = 'triathlon';
        }
        
        // Map duration (could be in seconds or minutes)
        let duration = 0;
        if (typeof act.duration_seconds === 'number') {
          duration = Math.round(act.duration_seconds / 60); // Convert seconds to minutes
        } else if (typeof act.duration === 'number') {
          duration = act.duration > 1000 ? Math.round(act.duration / 60) : act.duration; // If > 1000, assume seconds
        } else if (typeof act.moving_time === 'number') {
          duration = Math.round(act.moving_time / 60);
        } else if (typeof act.elapsed_time === 'number') {
          duration = Math.round(act.elapsed_time / 60);
        } else if (typeof act.duration_minutes === 'number') {
          duration = act.duration_minutes;
        }
        
        // Map distance (could be in meters or km) - round to 1 decimal place
        let distance = 0;
        if (typeof act.distance_meters === 'number') {
          distance = Math.round((act.distance_meters / 1000) * 10) / 10; // Convert meters to km, round to 1 decimal
        } else if (typeof act.distance === 'number') {
          distance = act.distance > 100 
            ? Math.round((act.distance / 1000) * 10) / 10 
            : Math.round(act.distance * 10) / 10; // If > 100, assume meters
        } else if (typeof act.distance_km === 'number') {
          distance = Math.round(act.distance_km * 10) / 10;
        }
        
        // Map elevation - round to 1 decimal place
        let elevation: number | undefined = undefined;
        if (typeof act.elevation_gain_meters === 'number') {
          elevation = Math.round(act.elevation_gain_meters * 10) / 10;
        } else if (typeof act.total_elevation_gain === 'number') {
          elevation = Math.round(act.total_elevation_gain * 10) / 10;
        } else if (typeof act.elevation_gain === 'number') {
          elevation = Math.round(act.elevation_gain * 10) / 10;
        } else if (typeof act.elevation === 'number') {
          elevation = Math.round(act.elevation * 10) / 10;
        }
        
        return {
          id: act.id as string,
          date: dateStr,
          sport,
          title: typeof titleField === 'string' ? titleField : titleField.toString(),
          duration,
          distance,
          avgPace: act.average_speed ? (typeof act.average_speed === 'number' ? `${Math.round(1000 / act.average_speed)} min/km` : act.average_speed.toString()) : undefined,
          avgHeartRate: typeof act.average_heartrate === 'number' ? act.average_heartrate :
                       typeof act.avg_heart_rate === 'number' ? act.avg_heart_rate :
                       typeof act.heart_rate === 'number' ? act.heart_rate : undefined,
          avgPower: typeof act.average_watts === 'number' ? act.average_watts :
                   typeof act.avg_power === 'number' ? act.avg_power :
                   typeof act.power === 'number' ? act.power : undefined,
          elevation,
          trainingLoad: typeof act.training_load === 'number' ? act.training_load :
                       typeof act.tss === 'number' ? act.tss :
                       typeof act.stress_score === 'number' ? act.stress_score :
                       typeof act.load === 'number' ? act.load : 0,
          source: 'strava' as const,
          coachFeedback: typeof act.coach_feedback === 'string' ? act.coach_feedback :
                        typeof act.coachFeedback === 'string' ? act.coachFeedback : undefined,
        } as import("../types").CompletedActivity;
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
 * Follows the workflow:
 * 1. Check if streams exist via activity endpoint (has_streams field)
 * 2. If not available, POST /activities/{id}/fetch-streams to fetch from Strava
 * 3. GET /activities/{id}/streams to get formatted data
 */
export const fetchActivityStreams = async (id: string): Promise<ActivityStreamsResponse> => {
  console.log("[API] Fetching activity streams", id);
  try {
    // First, try to get the activity to check if streams are available
    let activity;
    try {
      activity = await api.get(`/activities/${id}`);
    } catch {
      // If we can't get activity, proceed to fetch streams anyway
    }
    
    // Check if streams are already available
    const hasStreams = (activity as { has_streams?: boolean })?.has_streams;
    
    // If streams are not available, fetch them from Strava first
    if (!hasStreams) {
      console.log("[API] Streams not available, fetching from Strava...");
      try {
        await api.post(`/activities/${id}/fetch-streams`);
        // Wait a bit for backend to process
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.warn("[API] Failed to fetch streams from Strava, trying to get existing streams anyway:", error);
      }
    }
    
    // Get the formatted streams data
    const response = await api.get(`/activities/${id}/streams`);
    return response as unknown as ActivityStreamsResponse;
  } catch (error) {
    console.error("[API] Failed to fetch activity streams:", error);
    throw error;
  }
};

/**
 * Fetches training load data including TSS.
 */
export const fetchTrainingLoad = async (days?: number): Promise<{
  dates: string[];
  daily_load: number[];
  daily_tss: number[];
  ctl: number[];
  atl: number[];
  tsb: number[];
  weekly_dates?: string[];
  weekly_volume?: number[];
  weekly_rolling_avg?: number[];
  last_updated?: string;
}> => {
  console.log("[API] Fetching training load");
  try {
    const response = await api.get("/state/training-load", { params: days ? { days } : undefined });
    return response as unknown as {
      dates: string[];
      daily_load: number[];
      daily_tss: number[];
      ctl: number[];
      atl: number[];
      tsb: number[];
      weekly_dates?: string[];
      weekly_volume?: number[];
      weekly_rolling_avg?: number[];
      last_updated?: string;
    };
  } catch (error) {
    console.error("[API] Failed to fetch training load:", error);
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
 * Fetches coach context for personalized greetings.
 */
export const fetchCoachContext = async (): Promise<import("../types").CoachContext | null> => {
  console.log("[API] Fetching coach context");
  try {
    const response = await api.get("/coach/context");
    return response as unknown as import("../types").CoachContext;
  } catch (error) {
    console.error("[API] Failed to fetch coach context:", error);
    // Return null if endpoint doesn't exist yet - graceful degradation
    return null;
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

