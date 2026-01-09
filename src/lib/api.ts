import axios, { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { auth } from "./auth";
import type { AthleteProfileOut } from "./apiValidation";
import { getConversationId } from "./utils";

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

/**
 * Checks if an error is a CORS error
 */
const isCorsError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as { code?: string; message?: string; response?: { status?: number } };
  
  // CORS errors typically show up as:
  // - ERR_NETWORK code
  // - Status 0 or 500 with CORS message
  // - Message containing "CORS" or "Cross-Origin"
  if (err.code === 'ERR_NETWORK') {
    return true;
  }
  
  if (err.message && (
    err.message.includes('CORS') ||
    err.message.includes('Cross-Origin') ||
    err.message.includes('Access-Control-Allow-Origin')
  )) {
    return true;
  }
  
  // Status 500 with ERR_NETWORK is often a CORS issue
  if (err.response?.status === 500 && err.code === 'ERR_NETWORK') {
    return true;
  }
  
  return false;
};

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
 * Treats as success if:
 * - HTTP 200, OR
 * - Response has connected === false
 * Only throws errors for status >= 500
 */
export const disconnectStrava = async (): Promise<void> => {
  console.log("[API] Disconnecting Strava");
  try {
    const response = await api.post("/auth/strava/disconnect");
    
    // Check if response indicates disconnection was successful
    const responseData = response && typeof response === 'object' ? response : {};
    const connected = (responseData as { connected?: boolean }).connected;
    
    // Success if HTTP 200 OR connected === false
    if (connected === false) {
      console.log("[API] Strava disconnected successfully (connected: false)");
      return;
    }
    
    // If we got here, it's HTTP 200 (success)
    console.log("[API] Strava disconnected successfully (HTTP 200)");
  } catch (error) {
    const apiError = error as { status?: number; message?: string };
    
    // Only throw errors for status >= 500 (server errors)
    // Treat 4xx (client errors) as success - user is already disconnected
    if (apiError.status && apiError.status >= 500) {
      console.error("[API] Failed to disconnect Strava (server error):", error);
      throw error;
    }
    
    // For 4xx errors, check if response indicates already disconnected
    if (apiError.status && apiError.status < 500) {
      // Check if error response has connected === false
      const errorDetails = apiError as { details?: { connected?: boolean } };
      if (errorDetails.details && typeof errorDetails.details === 'object') {
        const connected = (errorDetails.details as { connected?: boolean }).connected;
        if (connected === false) {
          console.log("[API] Strava already disconnected (connected: false in error response)");
          return;
        }
      }
      
      // For other 4xx errors, still treat as success (user is likely already disconnected)
      console.log("[API] Strava disconnect treated as success (4xx error, likely already disconnected)");
      return;
    }
    
    // If no status code, it might be a network error - throw it
    console.error("[API] Failed to disconnect Strava (unknown error):", error);
    throw error;
  }
};

/**
 * Initiates Google OAuth connection.
 * Redirects directly to backend OAuth endpoint which handles the OAuth flow.
 * 
 * Note: This function redirects to /auth/google/login?platform=web which
 * returns a 302 redirect to Google's consent screen.
 */
export const initiateGoogleConnect = async (): Promise<void> => {
  console.log("[API] Initiating Google connect");
  
  try {
    // Get API base URL (same logic as auth.ts)
    const getBaseURL = () => {
      if (import.meta.env.PROD) {
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
        return apiUrl;
      }
      return "http://localhost:8000";
    };
    
    const API = getBaseURL();
    // Use the correct endpoint: /auth/google/login?platform=web
    // This endpoint returns a 302 redirect to Google's consent screen
    const url = `${API}/auth/google/login?platform=web`;
    
    console.log("[API] Redirecting to Google OAuth URL:", url);
    window.location.href = url;
  } catch (error) {
    console.error("[API] Failed to initiate Google connect:", error);
    throw error;
  }
};

/**
 * Disconnects Google integration.
 */
export const disconnectGoogle = async (): Promise<void> => {
  console.log("[API] Disconnecting Google");
  try {
    await api.post("/auth/google/disconnect");
  } catch (error) {
    console.error("[API] Failed to disconnect Google:", error);
    throw error;
  }
};

/**
 * Fetches user profile from the backend.
 * 
 * IMPORTANT: This endpoint is OPTIONAL. If it fails, returns null.
 * The app should redirect to onboarding if profile is missing.
 * 
 * @returns Profile data including onboarding status and source information, or null if not available
 * 
 * Note: Backend now supports target_event and goals fields.
 * Response includes these fields if set.
 */
export const fetchUserProfile = async (): Promise<AthleteProfileOut | null> => {
  console.log("[API] Fetching user profile (optional)");
  try {
    const response = await api.get("/me/profile");
    
    // Validate response is not undefined/null
    if (!response || typeof response !== 'object') {
      console.warn("[API] /me/profile returned invalid response:", response);
      return null;
    }
    
    // Backend now supports target_event and goals fields
    return response as unknown as AthleteProfileOut;
  } catch (error) {
    // Don't log CORS errors repeatedly - they're already handled by interceptor
    if (!isCorsError(error)) {
      console.warn("[API] Failed to fetch profile (this is optional):", error);
      
      // Check for database errors and provide helpful context
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number; message?: string };
        
        // 500 errors mean backend is broken - return null
        if (apiError.status === 500) {
          const errorStr = (apiError.message || '').toLowerCase();
          if (errorStr.includes('column') && errorStr.includes('does not exist') ||
              errorStr.includes('programmingerror') ||
              errorStr.includes('database')) {
            console.warn("[API] Database schema error detected. Profile endpoint unavailable.");
          }
          console.warn("[API] /me/profile returned 500 - treating as optional and returning null");
          return null;
        }
        
        // 404 means profile doesn't exist yet - this is expected for new users
        if (apiError.status === 404) {
          console.log("[API] Profile not found (404) - user needs to complete onboarding");
          return null;
        }
        
        // 401 means not authenticated - return null (auth will be handled elsewhere)
        if (apiError.status === 401) {
          console.log("[API] Not authenticated (401) - profile unavailable");
          return null;
        }
      }
    }
    
    // For any other error, return null (treat as optional)
    return null;
  }
};

/**
 * Updates user profile on the backend.
 * @param profileData - Profile data to update (will be mapped to backend format)
 * @returns Updated profile data
 */
export const updateUserProfile = async (
  profileData: Partial<AthleteProfileOut>
): Promise<AthleteProfileOut> => {
  console.log("[API] Updating user profile");
  try {
    // Map frontend fields to backend format
    // Note: profileData may use camelCase (frontend) or snake_case (backend)
    // We need to handle both formats
    const backendData: Record<string, unknown> = {};
    
    // Handle both camelCase and snake_case field names
    if (profileData.name !== undefined) backendData.name = profileData.name;
    if (profileData.email !== undefined) backendData.email = profileData.email;
    if (profileData.gender !== undefined) backendData.gender = profileData.gender;
    
    // Handle date_of_birth (snake_case) or dateOfBirth (camelCase)
    const dateOfBirth = (profileData as { date_of_birth?: string; dateOfBirth?: string }).date_of_birth 
      || (profileData as { date_of_birth?: string; dateOfBirth?: string }).dateOfBirth;
    if (dateOfBirth !== undefined) backendData.date_of_birth = dateOfBirth;
    
    // Handle unit_system (snake_case) or unitSystem (camelCase) - need to check this first for weight/height handling
    const unitSystem = (profileData as { unit_system?: 'imperial' | 'metric'; unitSystem?: 'imperial' | 'metric' }).unit_system 
      || (profileData as { unit_system?: 'imperial' | 'metric'; unitSystem?: 'imperial' | 'metric' }).unitSystem;
    if (unitSystem !== undefined) backendData.unit_system = unitSystem;
    
    // Handle weight - support weight_lbs (imperial) and weight_kg (metric) with 1 decimal precision
    const weightLbs = (profileData as { weight_lbs?: number }).weight_lbs;
    const weightKg = (profileData as { weight_kg?: number }).weight_kg;
    if (weightLbs !== undefined && weightLbs !== null) {
      // Send weight_lbs for imperial (1 decimal max)
      backendData.weight_lbs = Number(weightLbs.toFixed(1));
    } else if (weightKg !== undefined && weightKg !== null) {
      // Send weight_kg for metric (1 decimal max)
      backendData.weight_kg = Number(weightKg.toFixed(1));
    } else {
      // Fallback: try to get weight and convert based on unit system
      const weight = (profileData as { weight?: number | string }).weight;
      if (weight !== undefined && weight !== null) {
        const weightValue = typeof weight === 'number' ? weight : parseFloat(String(weight));
        if (!isNaN(weightValue)) {
          if (unitSystem === 'imperial') {
            backendData.weight_lbs = Number(weightValue.toFixed(1));
          } else {
            backendData.weight_kg = Number(weightValue.toFixed(1));
          }
        }
      }
    }
    
    // Handle height - support height_in (imperial) and height_cm (metric) with 1 decimal precision
    const heightIn = (profileData as { height_in?: number }).height_in;
    const heightCm = (profileData as { height_cm?: number }).height_cm;
    if (heightIn !== undefined && heightIn !== null) {
      // Send height_in for imperial (1 decimal max)
      backendData.height_in = Number(heightIn.toFixed(1));
    } else if (heightCm !== undefined && heightCm !== null) {
      // Send height_cm for metric (1 decimal max)
      backendData.height_cm = Number(heightCm.toFixed(1));
    } else {
      // Fallback: try to get height and convert based on unit system
      const height = (profileData as { height?: number | string }).height;
      if (height !== undefined && height !== null) {
        const heightValue = typeof height === 'number' ? height : parseFloat(String(height));
        if (!isNaN(heightValue)) {
          if (unitSystem === 'imperial') {
            backendData.height_in = Number(heightValue.toFixed(1));
          } else {
            backendData.height_cm = Number(heightValue.toFixed(1));
          }
        }
      }
    }
    
    if (profileData.location !== undefined) backendData.location = profileData.location;
    
    // Backend now supports target_event and goals
    const targetEvent = (profileData as { target_event?: unknown; targetEvent?: unknown }).target_event 
      || (profileData as { target_event?: unknown; targetEvent?: unknown }).targetEvent;
    if (targetEvent !== undefined) {
      backendData.target_event = targetEvent;
    }
    if (profileData.goals !== undefined) {
      backendData.goals = profileData.goals;
    }
    
    // FE-4: Support race_input with source marker for backend LLM processing
    const raceInput = (profileData as { race_input?: unknown }).race_input;
    if (raceInput !== undefined) {
      backendData.race_input = raceInput;
    }

    const response = await api.put("/me/profile", backendData);
    return response as unknown as AthleteProfileOut;
  } catch (error) {
    console.error("[API] Failed to update profile:", error);
    
    // Check if error is related to missing database column
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = String(error.message);
      if (errorMessage.includes('years_training') || errorMessage.includes('UndefinedColumn')) {
        console.warn("[API] Backend database schema issue detected - years_training column missing. This is a backend issue that needs to be fixed.");
      }
    }
    
    throw error;
  }
};

/**
 * Fetches training preferences from the backend.
 */
export const fetchTrainingPreferences = async (): Promise<{
  years_of_training: number;
  primary_sports: string[];
  available_days: string[];
  weekly_hours: number;
  training_focus: 'race_focused' | 'general_fitness';
  injury_history: boolean;
  injury_notes: string | null;
  consistency: string | null;
  goal: string | null;
}> => {
  console.log("[API] Fetching training preferences");
  try {
    const response = await api.get("/me/training-preferences");
    return response as unknown as {
      years_of_training: number;
      primary_sports: string[];
      available_days: string[];
      weekly_hours: number;
      training_focus: 'race_focused' | 'general_fitness';
      injury_history: boolean;
      injury_notes: string | null;
      consistency: string | null;
      goal: string | null;
    };
  } catch (error) {
    console.error("[API] Failed to fetch training preferences:", error);
    throw error;
  }
};

/**
 * Completes the onboarding process. This endpoint:
 * 1. Persists all onboarding data (profile and training preferences)
 * 2. Extracts structured race attributes from free-text goals using LLM
 * 3. Conditionally generates initial training plans (if user opts in)
 * 4. Marks onboarding as complete
 * 
 * Note: This is the recommended way to complete onboarding, but the frontend
 * currently uses separate updateUserProfile() and updateTrainingPreferences() calls.
 * 
 * @param data - Onboarding data including profile, training preferences, and plan generation flag
 * @returns Onboarding result with optional plans
 * 
 * Reference: See backend docs POST /api/onboarding/complete for complete details
 */
export const completeOnboarding = async (data: {
  profile?: Record<string, unknown>;
  training_preferences?: {
    years_of_training?: number;
    primary_sports?: string[];
    available_days?: string[];
    weekly_hours?: number;
    training_focus?: 'race_focused' | 'general_fitness';
    injury_history?: boolean;
    injury_notes?: string | null;
    consistency?: string | null;
    goal?: string | null;
  };
  generate_initial_plan: boolean;
}): Promise<{
  status: 'ok';
  weekly_intent: any | null;
  season_plan: any | null;
  provisional: boolean;
  warning: string | null;
}> => {
  console.log("[API] Completing onboarding");
  try {
    // Map frontend profile format to backend format (backend expects snake_case)
    const backendData: Record<string, unknown> = {
      generate_initial_plan: data.generate_initial_plan,
    };

    if (data.profile && Object.keys(data.profile).length > 0) {
      // Profile data is already in backend format (snake_case) from OnboardingChat
      backendData.profile = data.profile;
    }

    if (data.training_preferences) {
      backendData.training_preferences = data.training_preferences;
    }

    const response = await api.post("/api/onboarding/complete", backendData);
    return response as unknown as {
      status: 'ok';
      weekly_intent: any | null;
      season_plan: any | null;
      provisional: boolean;
      warning: string | null;
    };
  } catch (error) {
    console.error("[API] Failed to complete onboarding:", error);
    throw error;
  }
};

/**
 * Updates training preferences on the backend.
 */
export const updateTrainingPreferences = async (
  preferences: {
    years_of_training?: number;
    primary_sports?: string[];
    available_days?: string[];
    weekly_hours?: number;
    training_focus?: 'race_focused' | 'general_fitness';
    injury_history?: boolean;
    injury_notes?: string | null;
    consistency?: string | null;
    goal?: string | null;
  }
): Promise<{
  years_of_training: number;
  primary_sports: string[];
  available_days: string[];
  weekly_hours: number;
  training_focus: 'race_focused' | 'general_fitness';
  injury_history: boolean;
  injury_notes: string | null;
  consistency: string | null;
  goal: string | null;
}> => {
  console.log("[API] Updating training preferences");
  try {
    // FE-1: Send ALL fields from component state (not deltas)
    // Do not infer defaults silently - send exactly what's in the component state
    // The component ensures all fields are always present in state
    const backendPayload: Record<string, unknown> = {};
    
    // Send all fields that are provided (component always provides all fields)
    if (preferences.years_of_training !== undefined) backendPayload.years_of_training = preferences.years_of_training;
    if (preferences.primary_sports !== undefined) backendPayload.primary_sports = preferences.primary_sports;
    if (preferences.available_days !== undefined) backendPayload.available_days = preferences.available_days;
    if (preferences.weekly_hours !== undefined) backendPayload.weekly_hours = preferences.weekly_hours;
    if (preferences.training_focus !== undefined) backendPayload.training_focus = preferences.training_focus;
    if (preferences.injury_history !== undefined) backendPayload.injury_history = preferences.injury_history;
    if (preferences.injury_notes !== undefined) backendPayload.injury_notes = preferences.injury_notes;
    if (preferences.consistency !== undefined) backendPayload.consistency = preferences.consistency;
    if (preferences.goal !== undefined) backendPayload.goal = preferences.goal; // FE-2: Free text, stored verbatim

    const response = await api.put("/me/training-preferences", backendPayload);
    return response as unknown as {
      years_of_training: number;
      primary_sports: string[];
      available_days: string[];
      weekly_hours: number;
      training_focus: 'race_focused' | 'general_fitness';
      injury_history: boolean;
      injury_notes: string | null;
      consistency: string | null;
      goal: string | null;
    };
  } catch (error) {
    console.error("[API] Failed to update training preferences:", error);
    throw error;
  }
};

// ============ Activity Upload ============

export interface ActivityUploadResponse {
  status: 'ok';
  activity_id: string;
  deduplicated: boolean;
}

/**
 * Uploads an activity file (FIT, GPX, TCX).
 * @param file - The file to upload
 * @returns Upload response with activity_id and deduplicated flag
 */
export const uploadActivityFile = async (file: File): Promise<ActivityUploadResponse> => {
  console.log("[API] Uploading activity file:", file.name);
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    // Note: Do not set Content-Type header manually for FormData
    // Axios automatically sets it with the correct boundary parameter
    const response = await api.post("/activities/upload", formData);
    
    return response as unknown as ActivityUploadResponse;
  } catch (error) {
    console.error("[API] Failed to upload activity:", error);
    throw error;
  }
}

/**
 * Fetches privacy settings from the backend.
 */
export const fetchPrivacySettings = async (): Promise<{
  profile_visibility: 'public' | 'private' | 'coaches';
  share_activity_data: boolean;
  share_training_metrics: boolean;
}> => {
  console.log("[API] Fetching privacy settings");
  try {
    const response = await api.get("/me/privacy-settings");
    return response as unknown as {
      profile_visibility: 'public' | 'private' | 'coaches';
      share_activity_data: boolean;
      share_training_metrics: boolean;
    };
  } catch (error) {
    console.error("[API] Failed to fetch privacy settings:", error);
    throw error;
  }
};

/**
 * Updates privacy settings on the backend.
 */
export const updatePrivacySettings = async (
  settings: {
    profile_visibility?: 'public' | 'private' | 'coaches';
    share_activity_data?: boolean;
    share_training_metrics?: boolean;
  }
): Promise<{
  profile_visibility: 'public' | 'private' | 'coaches';
  share_activity_data: boolean;
  share_training_metrics: boolean;
}> => {
  console.log("[API] Updating privacy settings");
  try {
    const response = await api.put("/me/privacy-settings", settings);
    return response as unknown as {
      profile_visibility: 'public' | 'private' | 'coaches';
      share_activity_data: boolean;
      share_training_metrics: boolean;
    };
  } catch (error) {
    console.error("[API] Failed to update privacy settings:", error);
    throw error;
  }
};

/**
 * Fetches notification preferences from the backend.
 */
export const fetchNotificationPreferences = async (): Promise<{
  email_notifications: boolean;
  push_notifications: boolean;
  workout_reminders: boolean;
  training_load_alerts: boolean;
  race_reminders: boolean;
  weekly_summary: boolean;
  goal_achievements: boolean;
  coach_messages: boolean;
}> => {
  console.log("[API] Fetching notification preferences");
  try {
    const response = await api.get("/me/notifications");
    return response as unknown as {
      email_notifications: boolean;
      push_notifications: boolean;
      workout_reminders: boolean;
      training_load_alerts: boolean;
      race_reminders: boolean;
      weekly_summary: boolean;
      goal_achievements: boolean;
      coach_messages: boolean;
    };
  } catch (error) {
    console.error("[API] Failed to fetch notification preferences:", error);
    throw error;
  }
};

/**
 * Updates notification preferences on the backend.
 */
export const updateNotificationPreferences = async (
  preferences: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    workout_reminders?: boolean;
    training_load_alerts?: boolean;
    race_reminders?: boolean;
    weekly_summary?: boolean;
    goal_achievements?: boolean;
    coach_messages?: boolean;
  }
): Promise<{
  email_notifications: boolean;
  push_notifications: boolean;
  workout_reminders: boolean;
  training_load_alerts: boolean;
  race_reminders: boolean;
  weekly_summary: boolean;
  goal_achievements: boolean;
  coach_messages: boolean;
}> => {
  console.log("[API] Updating notification preferences");
  try {
    const response = await api.put("/me/notifications", preferences);
    return response as unknown as {
      email_notifications: boolean;
      push_notifications: boolean;
      workout_reminders: boolean;
      training_load_alerts: boolean;
      race_reminders: boolean;
      weekly_summary: boolean;
      goal_achievements: boolean;
      coach_messages: boolean;
    };
  } catch (error) {
    console.error("[API] Failed to update notification preferences:", error);
    throw error;
  }
};

/**
 * Changes user password.
 */
export const changePassword = async (
  passwordData: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }
): Promise<{ success: boolean; message: string }> => {
  console.log("[API] Changing password");
  try {
    const response = await api.post("/me/change-password", passwordData);
    return response as unknown as { success: boolean; message: string };
  } catch (error) {
    console.error("[API] Failed to change password:", error);
    throw error;
  }
};

/**
 * Changes user email.
 */
export const changeEmail = async (
  emailData: {
    new_email: string;
    password: string;
  }
): Promise<{ success: boolean; message: string }> => {
  console.log("[API] Changing email");
  try {
    const response = await api.post("/auth/change-email", emailData);
    return response as unknown as { success: boolean; message: string };
  } catch (error) {
    console.error("[API] Failed to change email:", error);
    throw error;
  }
};

/**
 * Gets Strava integration status.
 */
export const getStravaStatus = async (): Promise<{ connected: boolean; activity_count?: number }> => {
  console.log("[API] Fetching Strava status");
  try {
    const response = await api.get("/strava/status");
    return response as unknown as { connected: boolean; activity_count?: number };
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
        const normalizedSport = typeof sportField === 'string' ? sportField.toLowerCase() : String(sportField).toLowerCase();
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
 * 3. GET /activities/{id}/streams to get formatted data (with retries)
 * 
 * Note: Stops retrying immediately on CORS errors to avoid console spam.
 */
const unwrapStreamArray = (value: unknown): unknown[] | undefined => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== 'object') return undefined;

  const v = value as Record<string, unknown>;
  if (Array.isArray(v.data)) return v.data;
  if (Array.isArray(v.values)) return v.values;
  if (Array.isArray(v.items)) return v.items;

  return undefined;
};

const unwrapNumberArray = (value: unknown): number[] | undefined => {
  const arr = unwrapStreamArray(value);
  if (!arr) return undefined;
  const nums = arr
    .map((x) => (typeof x === 'number' ? x : Number(x)))
    .filter((x) => Number.isFinite(x));
  return nums;
};

const unwrapNullableNumberArray = (value: unknown): (number | null)[] | undefined => {
  const arr = unwrapStreamArray(value);
  if (!arr) return undefined;
  return arr.map((x) => {
    if (x === null || x === undefined) return null;
    const n = typeof x === 'number' ? x : Number(x);
    return Number.isFinite(n) ? n : null;
  });
};

const unwrapCoordArray = (value: unknown): number[][] | undefined => {
  const arr = unwrapStreamArray(value);
  if (!arr) return undefined;

  const coords = arr
    .map((coord) => {
      if (!Array.isArray(coord) || coord.length < 2) return null;
      const lat = typeof coord[0] === 'number' ? coord[0] : Number(coord[0]);
      const lng = typeof coord[1] === 'number' ? coord[1] : Number(coord[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return [lat, lng] as [number, number];
    })
    .filter((c): c is [number, number] => c !== null);

  return coords;
};

const normalizeActivityStreamsResponse = (raw: unknown): ActivityStreamsResponse => {
  const root = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const maybeStreams = root.streams && typeof root.streams === 'object' ? (root.streams as Record<string, unknown>) : root;
  const base = maybeStreams.data && typeof maybeStreams.data === 'object' ? (maybeStreams.data as Record<string, unknown>) : maybeStreams;

  const time = unwrapNumberArray(base.time) ?? [];
  const distance = unwrapNumberArray(base.distance) ?? [];

  // Prefer route_points; fallback to Strava-style latlng.
  const route_points =
    unwrapCoordArray(base.route_points) ??
    unwrapCoordArray(base.latlng) ??
    [];

  const elevation = unwrapNumberArray(base.elevation) ?? [];
  const pace = unwrapNullableNumberArray(base.pace) ?? [];

  const heartrateArr = unwrapNumberArray(base.heartrate ?? base.heart_rate);
  const powerArr = unwrapNumberArray(base.power ?? base.watts);
  const cadenceArr = unwrapNumberArray(base.cadence);

  const data_points =
    typeof base.data_points === 'number' && Number.isFinite(base.data_points)
      ? base.data_points
      : time.length;

  return {
    time,
    route_points,
    elevation,
    pace,
    distance,
    data_points,
    ...(heartrateArr && heartrateArr.length ? { heartrate: heartrateArr } : {}),
    ...(powerArr && powerArr.length ? { power: powerArr } : {}),
    ...(cadenceArr && cadenceArr.length ? { cadence: cadenceArr } : {}),
  };
};

export const fetchActivityStreams = async (id: string): Promise<ActivityStreamsResponse> => {
  console.log("[API] Fetching activity streams", id);
  try {
    // First, try to get the activity to check if streams are available
    let activity;
    let hasStreams = false;
    try {
      activity = await api.get(`/activities/${id}`);
      hasStreams = (activity as { has_streams?: boolean })?.has_streams === true;
    } catch (error) {
      // If this is a CORS error, don't proceed
      if (isCorsError(error)) {
        console.warn("[API] CORS error checking activity streams. Streams feature unavailable.");
        throw new Error("Stream data is not available due to server configuration.");
      }
      console.warn("[API] Could not fetch activity to check has_streams, proceeding...", error);
    }
    
    // If streams are not available, fetch them from Strava first
    if (!hasStreams) {
      console.log("[API] Streams not available, fetching from Strava...");
      try {
        await api.post(`/activities/${id}/fetch-streams`);
        // Wait for backend to process the fetch (may take a few seconds)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        // Stop immediately on CORS errors
        if (isCorsError(error)) {
          console.warn("[API] CORS error fetching streams from Strava. Streams feature unavailable.");
          throw new Error("Stream data is not available due to server configuration.");
        }
        
        const errorStatus = (error as { response?: { status?: number } })?.response?.status;
        const errorMessage = (error as { message?: string })?.message || '';
        
        // Backend now returns proper status codes:
        // 500 = Internal server error (fetching failed)
        // 404 = Streams not available
        if (errorStatus === 500) {
          console.error("[API] Failed to fetch streams from Strava (server error):", error);
          throw new Error("Failed to fetch stream data from Strava. Please try again later.");
        } else if (errorStatus === 404) {
          console.warn("[API] Streams not available for this activity:", error);
          throw new Error("Stream data is not available for this activity.");
        } else {
          console.warn("[API] Failed to fetch streams from Strava:", error);
          throw error;
        }
      }
    }
    
    // Try to get the formatted streams data with retries
    // The backend might need time to process after fetching
    let lastError: unknown;
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds between retries
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await api.get(`/activities/${id}/streams`);
        return normalizeActivityStreamsResponse(response);
      } catch (error) {
        // Stop immediately on CORS errors - don't retry
        if (isCorsError(error)) {
          console.warn("[API] CORS error fetching streams. Streams feature unavailable.");
          throw new Error("Stream data is not available due to server configuration.");
        }
        
        lastError = error;
        const errorStatus = (error as { response?: { status?: number } })?.response?.status;
        const errorMessage = (error as { message?: string })?.message || '';
        
        // Backend now returns proper status codes:
        // 404 = Streams not available (might be processing, so retry)
        // 500 = Server error (don't retry)
        if (errorStatus === 500) {
          console.error("[API] Server error fetching streams:", error);
          throw new Error("Server error while fetching stream data. Please try again later.");
        }
        
        // If it's a 404 and we haven't exhausted retries, wait and retry
        // (streams might still be processing after fetch)
        if (errorStatus === 404 && attempt < maxRetries - 1) {
          console.log(`[API] Streams not ready yet, retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // If it's the last attempt or a different error, throw
        if (attempt === maxRetries - 1) {
          if (errorStatus === 404) {
            throw new Error("Stream data is not available for this activity.");
          }
          throw error;
        }
      }
    }
    
    // Should not reach here, but just in case
    throw lastError;
  } catch (error) {
    // Don't log CORS errors repeatedly - they're already handled
    if (!isCorsError(error)) {
      console.error("[API] Failed to fetch activity streams:", error);
    }
    throw error;
  }
};

/**
 * Fetches training load data including TSS, CTL, ATL, TSB.
 * All metrics are normalized to -100 to 100 scale.
 * 
 * @param days Optional number of days to look back (default: 60)
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
    const params = days ? { days } : undefined;
    // Use longer timeout for training load as it processes many activities
    const response = await api.get("/state/training-load", { 
      params,
      timeout: 60000, // 60 seconds - training load processing can take time with many activities
    });
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
    // Return default empty response for 500 errors - training load is optional
    // This prevents retry spam and allows components to handle gracefully
    const apiError = error as { status?: number; code?: string; message?: string };
    if (apiError.status === 500 || apiError.status === 503) {
      console.warn("[API] Training load endpoint returned 500, returning empty response");
      return {
        dates: [],
        daily_load: [],
        daily_tss: [],
        ctl: [],
        atl: [],
        tsb: [],
      };
    }
    // For other errors (timeouts, network, etc.), still throw to allow components to handle
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
 * Fetches coaching summary from real LLM.
 */
export const fetchCoachSummary = async (): Promise<{
  summary: string;
  current_state: string;
  next_focus: string;
  last_updated: string;
}> => {
  console.log("[API] Fetching coach summary");
  try {
    const response = await api.get("/coach/summary");
    return response as unknown as {
      summary: string;
      current_state: string;
      next_focus: string;
      last_updated: string;
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach summary:", error);
    throw error;
  }
};

/**
 * @deprecated This endpoint doesn't exist in the API. The coach chat endpoint handles context automatically.
 * Fetches coach context for personalized greetings.
 */
export const fetchCoachContext = async (): Promise<import("../types").CoachContext | null> => {
  console.warn("[API] fetchCoachContext is deprecated - endpoint doesn't exist");
  // Return null since endpoint doesn't exist
  return null;
};

/**
 * Sends a chat message to the coach.
 */
export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  sport?: string;
}

export interface CoachChatResponse {
  reply?: string;
  intent?: string;
  conversation_id?: string;
  show_plan?: boolean;
  plan_items?: PlanItem[];
  response_type?: 'plan' | 'weekly_plan' | 'season_plan' | 'session_plan' | 'recommendation' | 'summary' | 'greeting' | 'question' | 'explanation' | 'smalltalk';
}

export const sendCoachChat = async (
  message: string,
  options?: { days?: number; days_to_race?: number | null }
): Promise<CoachChatResponse> => {
  console.log("[API] Sending coach chat message");
  try {
    const payload: { message: string; days?: number; days_to_race?: number | null } = { message };
    if (options?.days !== undefined) {
      payload.days = options.days;
    }
    if (options?.days_to_race !== undefined) {
      payload.days_to_race = options.days_to_race;
    }
    
    console.log("[API] Coach chat payload:", { 
      messageLength: message.length,
      hasDays: options?.days !== undefined,
      hasDaysToRace: options?.days_to_race !== undefined 
    });
    
    const response = await api.post("/coach/chat", payload);
    return response as unknown as CoachChatResponse;
  } catch (error) {
    const apiError = error as ApiError;
    console.error("[API] Failed to send coach chat:", {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      details: apiError.details,
      userMessage: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
    });
    
    // Provide more specific error messages based on status code
    if (apiError.status === 500) {
      const enhancedError: ApiError = {
        ...apiError,
        message: "The coach service is temporarily unavailable. Please try again in a moment.",
      };
      throw enhancedError;
    }
    
    throw error;
  }
};

/**
 * Fetches calendar week data for a specific week.
 * @param date - Optional date string (YYYY-MM-DD) for the week start. If not provided, returns current week.
 */
export const fetchCalendarWeek = async (date?: string): Promise<WeekResponse> => {
  console.log("[API] Fetching calendar week", date ? `(requested date: ${date})` : "(current week)");
  try {
    const response = await api.get("/calendar/week", date ? { params: { date } } : {});
    console.log("[API] Calendar week response:", response);
    
    // Handle different response formats
    // Axios responses have a .data property
    const responseData = response.data || response;
    if (responseData && typeof responseData === 'object') {
      // If response already has the expected structure
      if ('sessions' in responseData && Array.isArray(responseData.sessions)) {
        return responseData as WeekResponse;
      }
      // If response is wrapped in a data property
      if ('data' in responseData && responseData.data && typeof responseData.data === 'object') {
        const data = responseData.data as { sessions?: unknown[]; week_start?: string; week_end?: string };
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
      week_start: date || '',
      week_end: date || '',
      sessions: [],
    };
  } catch (error) {
    // Handle 500 errors gracefully - return empty week instead of crashing UI
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string };
      if (apiError.status === 500) {
        console.warn("[API] Calendar week returned 500 error. Returning empty week. UI will continue to work.");
        const fallbackDate = date || new Date().toISOString().split('T')[0];
        return {
          week_start: fallbackDate,
          week_end: fallbackDate,
          sessions: [],
        };
      }
    }
    console.error("[API] Failed to fetch calendar week:", error);
    throw error;
  }
};

/**
 * Fetches calendar today data.
 * Note: The API endpoint doesn't accept a date parameter - it returns today's data.
 */
export const fetchCalendarToday = async (date?: string): Promise<TodayResponse> => {
  console.log("[API] Fetching calendar today", date ? `(requested date: ${date} - API returns today)` : "");
  try {
    const response = await api.get("/calendar/today");
    return response as unknown as TodayResponse;
  } catch (error) {
    // Handle 500 errors gracefully - return empty today instead of crashing UI
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status?: number; message?: string };
      if (apiError.status === 500) {
        console.warn("[API] Calendar today returned 500 error. Returning empty today. UI will continue to work.");
        const fallbackDate = date || new Date().toISOString().split('T')[0];
        return {
          date: fallbackDate,
          sessions: [],
        };
      }
    }
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
    // Axios responses have a .data property
    const responseData = response.data || response;
    if (responseData && typeof responseData === 'object') {
      // If response already has the expected structure
      if ('sessions' in responseData && Array.isArray(responseData.sessions)) {
        return responseData as SeasonResponse;
      }
      // If response is wrapped in a data property
      if ('data' in responseData && responseData.data && typeof responseData.data === 'object') {
        const data = responseData.data as { sessions?: unknown[]; season_start?: string; season_end?: string; total_sessions?: number; completed_sessions?: number; planned_sessions?: number };
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
 * Fetches calendar sessions (paginated).
 */
export const fetchCalendarSessions = async (params?: { limit?: number; offset?: number }): Promise<{
  sessions: CalendarSession[];
  total: number;
}> => {
  console.log("[API] Fetching calendar sessions");
  try {
    const response = await api.get("/calendar/sessions", { params });
    return response as unknown as {
      sessions: CalendarSession[];
      total: number;
    };
  } catch (error) {
    console.error("[API] Failed to fetch calendar sessions:", error);
    throw error;
  }
};

/**
 * Updates the status of a calendar session.
 * @param sessionId - The ID of the session to update
 * @param status - The new status: "completed", "skipped", "cancelled", or "planned"
 * @param completedActivityId - Optional ID of the completed activity to link to the session
 */
export const updateSessionStatus = async (
  sessionId: string,
  status: "completed" | "skipped" | "cancelled" | "planned",
  completedActivityId?: string
): Promise<CalendarSession> => {
  console.log("[API] Updating session status:", { sessionId, status, completedActivityId });
  try {
    const response = await api.patch(`/calendar/sessions/${sessionId}/status`, {
      status,
      completed_activity_id: completedActivityId,
    });
    console.log("[API] Session status updated:", response);
    // Axios responses have a .data property
    const responseData = response.data || response;
    return responseData as CalendarSession;
  } catch (error) {
    console.error("[API] Failed to update session status:", error);
    throw error;
  }
};

/**
 * Gets athlete sync status and connection state.
 */
export const fetchUserStatus = async (): Promise<{
  connected: boolean;
  last_sync: string;
  state: "ok" | "syncing" | "stale";
}> => {
  console.log("[API] Fetching user status");
  try {
    const response = await api.get("/me/status");
    return response as unknown as {
      connected: boolean;
      last_sync: string;
      state: "ok" | "syncing" | "stale";
    };
  } catch (error) {
    console.error("[API] Failed to fetch user status:", error);
    throw error;
  }
};

/**
 * Triggers full historical backfill from Strava.
 */
export const triggerHistoricalSync = async (): Promise<{
  success: boolean;
  message: string;
  user_id: string;
  last_sync: string;
}> => {
  console.log("[API] Triggering historical sync");
  try {
    const response = await api.post("/me/sync/history");
    return response as unknown as {
      success: boolean;
      message: string;
      user_id: string;
      last_sync: string;
    };
  } catch (error) {
    console.error("[API] Failed to trigger historical sync:", error);
    throw error;
  }
};

/**
 * Checks for recent activities (last 48 hours) on refresh or new session.
 * Runs in background to ensure today's activities are synced.
 */
export const checkRecentActivities = async (): Promise<{
  success: boolean;
  message: string;
  last_sync: string;
}> => {
  console.log("[API] Checking for recent activities");
  try {
    const response = await api.post("/me/sync/check");
    return response as unknown as {
      success: boolean;
      message: string;
      last_sync: string;
    };
  } catch (error) {
    console.error("[API] Failed to check recent activities:", error);
    throw error;
  }
};

/**
 * User-initiated sync button.
 * Fetches activities since last sync (or last 48 hours for safety), runs in background.
 */
export const syncActivitiesNow = async (): Promise<{
  success: boolean;
  message: string;
  last_sync: string;
}> => {
  console.log("[API] User-initiated sync");
  try {
    const response = await api.post("/me/sync/now");
    return response as unknown as {
      success: boolean;
      message: string;
      last_sync: string;
    };
  } catch (error) {
    console.error("[API] Failed to sync activities:", error);
    throw error;
  }
};

/**
 * Gets debug overview data with server timestamp.
 */
export const fetchOverviewDebug = async (days?: number): Promise<{
  server_time: string;
  overview: {
    connected: boolean;
    last_sync: string;
    data_quality: string;
    metrics: {
      ctl?: [string, number][];
      atl?: [string, number][];
      tsb?: [string, number][];
    };
    today: {
      ctl: number;
      atl: number;
      tsb: number;
      tsb_7d_avg?: number;
    };
  };
}> => {
  console.log("[API] Fetching overview debug");
  try {
    const params = days ? { days } : undefined;
    const response = await api.get("/me/overview/debug", { params });
    return response as unknown as {
      server_time: string;
      overview: {
        connected: boolean;
        last_sync: string;
        data_quality: string;
        metrics: {
          ctl?: [string, number][];
          atl?: [string, number][];
          tsb?: [string, number][];
        };
        today: {
          ctl: number;
          atl: number;
          tsb: number;
          tsb_7d_avg?: number;
        };
      };
    };
  } catch (error) {
    console.error("[API] Failed to fetch overview debug:", error);
    throw error;
  }
};

/**
 * Gets current training state and metrics.
 */
export const fetchTrainingState = async (): Promise<{
  current: {
    ctl: number;
    atl: number;
    tsb: number;
    trend: "increasing" | "stable" | "decreasing";
  };
  week_volume_hours: number;
  week_load: number;
  month_volume_hours: number;
  month_load: number;
  last_updated: string;
}> => {
  console.log("[API] Fetching training state");
  try {
    const response = await api.get("/training/state");
    return response as unknown as {
      current: {
        ctl: number;
        atl: number;
        tsb: number;
        trend: "increasing" | "stable" | "decreasing";
      };
      week_volume_hours: number;
      week_load: number;
      month_volume_hours: number;
      month_load: number;
      last_updated: string;
    };
  } catch (error) {
    console.error("[API] Failed to fetch training state:", error);
    throw error;
  }
};

/**
 * Gets training distribution across zones and activity types.
 */
export const fetchTrainingDistribution = async (period?: "week" | "month" | "season"): Promise<{
  period: string;
  total_hours: number;
  zones: Array<{
    zone: string;
    hours: number;
    percentage: number;
  }>;
  by_type: Record<string, number>;
}> => {
  console.log("[API] Fetching training distribution");
  try {
    const params = period ? { period } : undefined;
    const response = await api.get("/training/distribution", { params });
    return response as unknown as {
      period: string;
      total_hours: number;
      zones: Array<{
        zone: string;
        hours: number;
        percentage: number;
      }>;
      by_type: Record<string, number>;
    };
  } catch (error) {
    console.error("[API] Failed to fetch training distribution:", error);
    throw error;
  }
};

/**
 * Gets training signals and observations.
 */
export const fetchTrainingSignals = async (): Promise<{
  signals: Array<{
    id: string;
    type: "fatigue" | "overreaching" | "undertraining" | "readiness";
    severity: "low" | "moderate" | "high";
    message: string;
    timestamp: string;
    metrics?: Record<string, number>;
  }>;
  summary: string;
  recommendation: string;
}> => {
  console.log("[API] Fetching training signals");
  try {
    const response = await api.get("/training/signals");
    return response as unknown as {
      signals: Array<{
        id: string;
        type: "fatigue" | "overreaching" | "undertraining" | "readiness";
        severity: "low" | "moderate" | "high";
        message: string;
        timestamp: string;
        metrics?: Record<string, number>;
      }>;
      summary: string;
      recommendation: string;
    };
  } catch (error) {
    console.error("[API] Failed to fetch training signals:", error);
    throw error;
  }
};

/**
 * Gets coaching insights from the LLM Coach.
 */
export const fetchCoachState = async (): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
  risk_level: "none" | "low" | "moderate" | "high";
  intervention: boolean;
  follow_up_prompts: string[] | null;
}> => {
  console.log("[API] Fetching coach state");
  try {
    const response = await api.get("/state/coach");
    return response as unknown as {
      summary: string;
      insights: string[];
      recommendations: string[];
      risk_level: "none" | "low" | "moderate" | "high";
      intervention: boolean;
      follow_up_prompts: string[] | null;
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach state:", error);
    throw error;
  }
};

/**
 * Gets initial coach message for new users or users with insufficient data.
 */
export const fetchCoachInitial = async (): Promise<{
  summary: string;
  insights: string[];
  recommendations: string[];
  risk_level: "none" | "low" | "moderate" | "high";
  intervention: boolean;
  follow_up_prompts: string[] | null;
  data_quality?: string;
  activity_count?: number;
}> => {
  console.log("[API] Fetching coach initial message");
  try {
    const response = await api.get("/state/coach/initial");
    return response as unknown as {
      summary: string;
      insights: string[];
      recommendations: string[];
      risk_level: "none" | "low" | "moderate" | "high";
      intervention: boolean;
      follow_up_prompts: string[] | null;
      data_quality?: string;
      activity_count?: number;
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach initial:", error);
    throw error;
  }
};

/**
 * Gets coaching observations from real LLM.
 */
export const fetchCoachObservations = async (): Promise<{
  observations: Array<{
    id: string;
    category: "volume" | "intensity" | "recovery" | "consistency" | "general";
    observation: string;
    timestamp: string;
    related_metrics?: Record<string, number>;
  }>;
  total: number;
}> => {
  console.log("[API] Fetching coach observations");
  try {
    const response = await api.get("/coach/observations");
    return response as unknown as {
      observations: Array<{
        id: string;
        category: "volume" | "intensity" | "recovery" | "consistency" | "general";
        observation: string;
        timestamp: string;
        related_metrics?: Record<string, number>;
      }>;
      total: number;
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach observations:", error);
    throw error;
  }
};

/**
 * Gets coaching recommendations from real LLM.
 */
export const fetchCoachRecommendations = async (): Promise<{
  recommendations: Array<{
    id: string;
    priority: "high" | "medium" | "low";
    category: "intensity" | "volume" | "recovery" | "structure" | "general";
    recommendation: string;
    rationale: string;
    timestamp: string;
  }>;
  total: number;
}> => {
  console.log("[API] Fetching coach recommendations");
  try {
    const response = await api.get("/coach/recommendations");
    return response as unknown as {
      recommendations: Array<{
        id: string;
        priority: "high" | "medium" | "low";
        category: "intensity" | "volume" | "recovery" | "structure" | "general";
        recommendation: string;
        rationale: string;
        timestamp: string;
      }>;
      total: number;
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach recommendations:", error);
    throw error;
  }
};

/**
 * Gets confidence scores for coach outputs based on real data quality.
 */
export const fetchCoachConfidence = async (): Promise<{
  overall: number;
  data_quality: number;
  recommendations: number;
  observations: number;
  factors: string[];
  last_updated: string;
}> => {
  console.log("[API] Fetching coach confidence");
  try {
    const response = await api.get("/coach/confidence");
    return response as unknown as {
      overall: number;
      data_quality: number;
      recommendations: number;
      observations: number;
      factors: string[];
      last_updated: string;
    };
  } catch (error) {
    console.error("[API] Failed to fetch coach confidence:", error);
    throw error;
  }
};

/**
 * Asks the coach a question using real LLM.
 */
export const askCoach = async (
  message: string,
  context?: { days?: number; days_to_race?: number | null }
): Promise<{
  reply: string;
  intent: string;
  confidence: number;
}> => {
  console.log("[API] Asking coach question");
  try {
    const payload: { message: string; context?: { days?: number; days_to_race?: number | null } } = { message };
    if (context) {
      payload.context = context;
    }
    const response = await api.post("/coach/ask", payload);
    return response as unknown as {
      reply: string;
      intent: string;
      confidence: number;
    };
  } catch (error) {
    console.error("[API] Failed to ask coach:", error);
    throw error;
  }
};

/**
 * Gets training metrics (CTL, ATL, TSB) with daily aggregations for charting.
 */
export const fetchAnalyticsMetrics = async (days?: number): Promise<{
  chart: Array<{
    date: string;
    CTL: number;
    ATL: number;
    TSB: number;
    hr: number;
    dist: number;
    time: number;
  }>;
}> => {
  console.log("[API] Fetching analytics metrics");
  try {
    const params = days ? { days } : undefined;
    const response = await api.get("/analytics/metrics", { params });
    return response as unknown as {
      chart: Array<{
        date: string;
        CTL: number;
        ATL: number;
        TSB: number;
        hr: number;
        dist: number;
        time: number;
      }>;
    };
  } catch (error) {
    console.error("[API] Failed to fetch analytics metrics:", error);
    throw error;
  }
};

/**
 * Gets sync progress information for the current user.
 */
export const fetchStravaSyncProgress = async (): Promise<{
  last_sync: string | null;
  sync_in_progress: boolean;
  total_activities: number;
}> => {
  console.log("[API] Fetching Strava sync progress");
  try {
    const response = await api.get("/strava/sync-progress");
    return response as unknown as {
      last_sync: string | null;
      sync_in_progress: boolean;
      total_activities: number;
    };
  } catch (error) {
    console.error("[API] Failed to fetch Strava sync progress:", error);
    throw error;
  }
};

/**
 * Gets user-specific Strava connection status.
 */
export const getUserStravaStatus = async (): Promise<{
  connected: boolean;
  athlete_id: string;
  last_sync_at: number;
}> => {
  console.log("[API] Fetching user-specific Strava status");
  try {
    const response = await api.get("/integrations/strava/status");
    return response as unknown as {
      connected: boolean;
      athlete_id: string;
      last_sync_at: number;
    };
  } catch (error) {
    console.error("[API] Failed to fetch user Strava status:", error);
    throw error;
  }
};

/**
 * @deprecated This endpoint doesn't exist in the API documentation. Use syncStravaData() instead.
 * Triggers Strava data aggregation.
 */
export const aggregateStravaData = async (): Promise<void> => {
  console.warn("[API] aggregateStravaData is deprecated - endpoint doesn't exist in API documentation");
  // Call sync instead as a fallback
  return syncStravaData();
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

/**
 * Safe API call wrapper that handles undefined/null responses gracefully.
 * Never assumes success - always checks if result is valid.
 * 
 * @param fn - Function that returns a Promise
 * @returns Promise that resolves to the result or null on error
 */
export async function safeApiCall<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    const result = await fn();
    // Check if result is actually valid (not undefined/null)
    if (result === undefined || result === null) {
      console.warn("[API] safeApiCall: Function returned undefined/null");
      return null;
    }
    return result;
  } catch (err) {
    console.error("[API] safeApiCall error:", err);
    return null;
  }
}

const normalizeError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    // Backend error format: {"error": "error_code", "message": "human readable message"}
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
    // Backend auth errors use: {"error": "code", "message": "..."}
    // Prioritize message field (human-readable) over error field (machine-readable code)
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
      // Check for database/schema errors in the error message
      const errorStr = JSON.stringify(data || axiosError.message || '').toLowerCase();
      if (errorStr.includes('column') && errorStr.includes('does not exist') ||
          errorStr.includes('programmingerror') ||
          errorStr.includes('undefinedcolumn') ||
          errorStr.includes('migration')) {
        message = "Database configuration error. The server is being updated. Please try again in a few moments.";
      } else {
        message = "Server error. Please try again later.";
      }
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
// CRITICAL: This interceptor is SYNCHRONOUS - no async operations allowed
// Token source of truth: localStorage.getItem('auth_token')
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Ensure headers object exists (axios may not initialize it)
    if (!config.headers) {
      config.headers = new AxiosHeaders();
    }
    
    // SINGLE SOURCE OF TRUTH: Read token directly from localStorage (synchronous)
    const TOKEN_KEY = 'auth_token';
    const token = localStorage.getItem(TOKEN_KEY);
    
    // If token exists and is not "null" string, add Authorization header
    if (token && token !== 'null' && token.trim() !== '') {
      // Check if token is expired (synchronous check)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = payload.exp;
          if (exp && exp * 1000 < Date.now()) {
            // Token is expired - clear it
            localStorage.removeItem(TOKEN_KEY);
            // Don't add header - request will go unauthenticated
            // Response interceptor will handle 401
          } else {
            // Token is valid - add Authorization header
            const authHeader = `Bearer ${token}`;
            
            // Set header
            if (typeof (config.headers as { set?: (name: string, value: string) => void }).set === 'function') {
              (config.headers as { set: (name: string, value: string) => void }).set('Authorization', authHeader);
            } else {
              (config.headers as Record<string, string>)['Authorization'] = authHeader;
            }
          }
        }
      } catch {
        // Invalid token format - clear it
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    
    // Ensure Content-Type is set for POST/PUT requests with data
    if ((config.method === 'post' || config.method === 'put' || config.method === 'patch') && config.data) {
      const contentType = 'application/json';
      if (typeof (config.headers as { set?: (name: string, value: string) => void }).set === 'function') {
        (config.headers as { set: (name: string, value: string) => void }).set('Content-Type', contentType);
      } else {
        (config.headers as Record<string, string>)['Content-Type'] = contentType;
      }
    }
    
    // Add conversation ID header to every request
    const conversationId = getConversationId();
    if (typeof (config.headers as { set?: (name: string, value: string) => void }).set === 'function') {
      (config.headers as { set?: (name: string, value: string) => void }).set('X-Conversation-Id', conversationId);
    } else {
      (config.headers as Record<string, string>)['X-Conversation-Id'] = conversationId;
    }
    
    // Dev-only logging for verification
    if (import.meta.env.DEV) {
      console.log('[API Request] X-Conversation-Id:', conversationId, 'URL:', config.url);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we've already logged a CORS error to avoid console spam
let corsErrorLogged = false;

// Custom event to trigger navigation from React Router context
const createNavigationEvent = (path: string) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-redirect', { detail: { path } }));
  }
};

// Custom event to trigger logout from AuthContext
const triggerLogoutEvent = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth-logout', { detail: {} }));
  }
};

api.interceptors.response.use(
  (response) => {
    const requestUrl = response.config?.url || '';
    const isMeEndpoint = requestUrl === '/me' || requestUrl.endsWith('/me');
    
    // Guard against undefined/null responses
    // Backend may return 200 with broken/empty payload
    if (response.data === undefined || response.data === null) {
      console.warn("[API] Response interceptor: response.data is undefined/null", {
        status: response.status,
        url: requestUrl,
      });
      
      // For /me endpoint, return null explicitly (means not authenticated)
      // For other endpoints, return {} to prevent .then() errors while maintaining compatibility
      if (isMeEndpoint) {
        return null;
      }
      return {};
    }
    
    // Log /me responses for debugging
    if (isMeEndpoint) {
      console.log("[API] /me response interceptor:", {
        url: requestUrl,
        status: response.status,
        data: response.data,
        dataType: typeof response.data,
      });
    }
    
    return response.data;
  },
  (error) => {
    const normalizedError = normalizeError(error);
    const requestUrl = error?.config?.url || '';
    const isMeEndpoint = requestUrl === '/me' || requestUrl.endsWith('/me');
    
    // CRITICAL: Treat 404 on /me as 401 (not authenticated)
    // If /me doesn't exist, the backend contract is broken, but from the frontend's
    // perspective, this means "user not found" = "not authenticated"
    if (normalizedError.status === 404 && isMeEndpoint) {
      console.warn("[API] /me returned 404 - treating as not authenticated (backend contract issue)");
      // Convert 404 to 401 behavior for /me endpoint
      normalizedError.status = 401;
      normalizedError.message = "Authentication required. Please log in.";
    }
    
    // Handle 401: ALWAYS clear token and trigger logout
    // This ensures auth state and token never diverge
    if (normalizedError.status === 401) {
      // CRITICAL: Clear token immediately (single source of truth)
      const TOKEN_KEY = 'auth_token';
      localStorage.removeItem(TOKEN_KEY);
      
      // Trigger logout event for AuthContext to handle
      // This ensures React state is updated to match token state
      triggerLogoutEvent();
      
      // Trigger navigation to login (unless on public pages)
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const publicPaths = ["/login", "/signup", "/onboarding"];
      const isPublicPath = publicPaths.some(path => 
        currentPath === path || currentPath.startsWith(`${path}/`)
      );
      
      if (!isPublicPath) {
        createNavigationEvent("/login");
      }
      
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

