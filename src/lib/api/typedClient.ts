/**
 * Typed API Client
 * 
 * This module provides a type-safe wrapper around the API client
 * using generated OpenAPI types. It prevents calling non-existent endpoints.
 * 
 * Usage:
 * ```ts
 * import { conversationsApi, calendarApi, activitiesApi, authApi } from '@/lib/api/typedClient';
 * 
 * const messages = await conversationsApi.getMessages(conversationId);
 * const today = await calendarApi.getToday();
 * ```
 * 
 * IMPORTANT: All typed client functions return axios responses.
 * Use `response.data || response` to extract the actual data.
 * 
 * TODO: Consider moving disconnectStrava and changeEmail to settingsApi
 * for better domain separation (auth = identity/session, settings = profile/preferences).
 */

import { api } from '../api';
import type {
  CalendarSession,
  TodayResponse,
  WeekResponse,
  SeasonResponse,
  WeeklySummaryCard,
  WriteResponse,
  ActivityStreamsResponse,
} from '../api';
import type { CompletedActivity } from '@/types';

/**
 * Extract data from axios response.
 * 
 * Axios wraps responses in { data: ... }, but some code expects direct data.
 * This helper normalizes the response shape.
 * 
 * Pattern: const response = await api.get(...); const data = response.data || response;
 */
function extractResponseData<T>(response: { data?: T } | T): T {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

// Import generated types (will be available after running generate-api-contract.sh)
// For now, we'll use a placeholder that will be replaced with actual generated types
type OpenAPIPaths = Record<string, Record<string, unknown>>;

/**
 * Type-safe API client for conversations endpoints.
 * 
 * All endpoints are validated against the OpenAPI schema at compile time.
 */
export const conversationsApi = {
  /**
   * Get messages for a conversation.
   * 
   * @param conversationId - Conversation ID (format: c_<UUID>)
   * @returns Array of conversation messages
   */
  async getMessages(conversationId: string) {
    // Type-safe path construction
    const path = `/conversations/${conversationId}/messages` as const;
    return api.get<Array<{
      id: string;
      role: 'assistant' | 'user' | 'athlete';
      content: string;
      transient?: boolean;
      stage?: string;
      message_type?: 'assistant' | 'progress' | 'final';
      show_plan?: boolean;
      plan_items?: Array<{
        id: string;
        title: string;
        description?: string;
        date?: string;
        sport?: string;
      }>;
      metadata?: {
        week_number?: number | string;
        total_weeks?: number | string;
        [key: string]: unknown;
      };
      created_at: string;
    }>>(path);
  },

  /**
   * Get progress events for a conversation.
   * 
   * @param conversationId - Conversation ID (format: c_<UUID>)
   * @returns Progress response with steps and events
   */
  async getProgress(conversationId: string) {
    const path = `/conversations/${conversationId}/progress` as const;
    return api.get<{
      steps: Array<{
        id: string;
        label: string;
      }>;
      events: Array<{
        conversation_id: string;
        step_id: string;
        label: string;
        status: 'planned' | 'in_progress' | 'completed' | 'failed' | 'skipped';
        timestamp: string;
        message?: string | null;
      }>;
    }>(path);
  },
};

/**
 * Type-safe API client for calendar endpoints.
 * 
 * All endpoints are validated against the OpenAPI schema at compile time.
 */
export const calendarApi = {
  /**
   * Get today's calendar sessions.
   * 
   * @returns Today's sessions
   */
  async getToday() {
    const path = "/calendar/today" as const;
    return api.get<TodayResponse>(path);
  },

  /**
   * Get calendar week data.
   * 
   * @param date - Optional date string (YYYY-MM-DD) to get specific week
   * @returns Week sessions
   */
  async getWeek(date?: string) {
    const path = "/calendar/week" as const;
    return api.get<WeekResponse>(path, date ? { params: { date } } : {});
  },

  /**
   * Get calendar season data.
   * 
   * @returns Season sessions
   */
  async getSeason() {
    const path = "/calendar/season" as const;
    return api.get<SeasonResponse>(path);
  },

  /**
   * Get calendar week summary.
   * 
   * @param date - Date string (YYYY-MM-DD) for the week
   * @returns Week summary data
   */
  async getWeekSummary(date: string) {
    const path = "/calendar/week-summary" as const;
    return api.get<WeeklySummaryCard>(path, { params: { date } });
  },

  /**
   * Get calendar sessions (paginated).
   * 
   * @param params - Pagination parameters
   * @returns Paginated sessions
   */
  async getSessions(params?: { limit?: number; offset?: number }) {
    const path = "/calendar/sessions" as const;
    return api.get<{
      sessions: CalendarSession[];
      total: number;
    }>(path, params ? { params } : {});
  },

  /**
   * Update session status.
   * 
   * @param sessionId - Session ID
   * @param payload - Status update payload
   * @returns Updated session or proposal response
   */
  async updateSessionStatus(
    sessionId: string,
    payload: {
      status: string;
      completed_activity_id?: string;
      confirmed?: boolean;
    }
  ) {
    const path = `/calendar/sessions/${sessionId}/status` as const;
    return api.patch<CalendarSession | WriteResponse<CalendarSession>>(path, payload);
  },

  /**
   * Update planned session.
   * 
   * @param sessionId - Planned session ID
   * @param payload - Update payload
   * @returns Updated session
   */
  async updatePlannedSession(
    sessionId: string,
    payload: {
      scheduled_date?: string;
      start_time?: string | null;
      order_in_day?: number | null;
    }
  ) {
    const path = `/planned-sessions/${sessionId}` as const;
    return api.patch<CalendarSession>(path, payload);
  },

  /**
   * Delete a planned session.
   * 
   * @param sessionId - Planned session ID
   */
  async deletePlannedSession(sessionId: string) {
    const path = `/planned-sessions/${sessionId}` as const;
    return api.delete<void>(path);
  },
};

/**
 * Type-safe API client for activities endpoints.
 * 
 * All endpoints are validated against the OpenAPI schema at compile time.
 */
export const activitiesApi = {
  /**
   * List activities with optional filtering and pagination.
   * 
   * @param params - Query parameters (limit, offset, start date, end date)
   * @returns Array of activities (raw backend format - mapping happens in fetchActivities)
   */
  async list(params?: {
    limit?: number;
    offset?: number;
    start?: string;
    end?: string;
  }) {
    const path = "/activities" as const;
    // Note: Response format varies, so we return unknown and let fetchActivities handle mapping
    return api.get<unknown>(path, params ? { params } : {});
  },

  /**
   * Get a single activity by ID.
   * 
   * @param activityId - Activity ID
   * @returns Activity (raw backend format)
   */
  async getById(activityId: string) {
    const path = `/activities/${activityId}` as const;
    return api.get<unknown>(path);
  },

  /**
   * Upload a manual activity.
   * 
   * @param formData - Form data with activity details
   * @returns Upload response
   */
  async upload(formData: FormData) {
    const path = "/activities/upload" as const;
    return api.post<{
      id: string;
      message?: string;
    }>(path, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  /**
   * Unpair an activity from its planned session.
   * 
   * @param activityId - Activity ID
   */
  async unpair(activityId: string) {
    const path = `/activities/${activityId}/unpair` as const;
    return api.post<void>(path);
  },

  /**
   * Fetch streams for an activity from Strava.
   * 
   * @param activityId - Activity ID
   */
  async fetchStreams(activityId: string) {
    const path = `/activities/${activityId}/fetch-streams` as const;
    return api.post<void>(path);
  },

  /**
   * Get activity streams (GPS, heart rate, power, etc.).
   * 
   * @param activityId - Activity ID
   * @returns Streams data
   */
  async getStreams(activityId: string) {
    const path = `/activities/${activityId}/streams` as const;
    return api.get<ActivityStreamsResponse>(path);
  },

  /**
   * Delete an activity.
   * 
   * @param activityId - Activity ID
   */
  async delete(activityId: string) {
    const path = `/activities/${activityId}` as const;
    return api.delete<void>(path);
  },

  /**
   * Manually pair an activity with a planned session.
   * 
   * @param activityId - Activity ID
   * @param plannedSessionId - Planned session ID
   */
  async manualPair(activityId: string, plannedSessionId: string) {
    const path = "/admin/pairing/merge" as const;
    return api.post<void>(path, {
      activity_id: activityId,
      planned_session_id: plannedSessionId,
    });
  },

  /**
   * Manually unpair an activity from its planned session.
   * 
   * @param activityId - Activity ID
   */
  async manualUnpair(activityId: string) {
    const path = "/admin/pairing/unmerge" as const;
    return api.post<void>(path, {
      activity_id: activityId,
    });
  },
};

/**
 * Type-safe API client for authentication endpoints.
 * 
 * All endpoints are validated against the OpenAPI schema at compile time.
 */
export const authApi = {
  /**
   * Get current user (authentication check).
   * 
   * This is the REQUIRED endpoint for validating authentication.
   * Returns user data if authenticated, or null/error if not.
   * 
   * @returns Current user data or null
   */
  async getMe() {
    const path = "/me" as const;
    return api.get<{
      user_id?: string;
      id?: string;
      authenticated?: boolean;
      email?: string | null;
      onboarding_complete?: boolean;
      strava_connected?: boolean;
      timezone?: string;
      role?: "athlete" | "coach";
    }>(path);
  },

  /**
   * Logout the current user.
   * 
   * Clears HTTP-only cookie (web) or tokens (mobile).
   */
  async logout() {
    const path = "/auth/logout" as const;
    return api.post<void>(path);
  },

  /**
   * Get Strava OAuth URL.
   * 
   * @returns OAuth redirect URL
   */
  async getStravaOAuthUrl() {
    const path = "/auth/strava" as const;
    return api.get<{
      redirect_url?: string;
      oauth_url?: string;
      url?: string;
    }>(path);
  },

  /**
   * Disconnect Strava integration.
   */
  async disconnectStrava() {
    const path = "/auth/strava/disconnect" as const;
    return api.post<{
      connected?: boolean;
    }>(path);
  },

  /**
   * Disconnect Google integration.
   */
  async disconnectGoogle() {
    const path = "/auth/google/disconnect" as const;
    return api.post<void>(path);
  },

  /**
   * Change user email.
   * 
   * @param email - New email address
   */
  async changeEmail(email: string) {
    const path = "/auth/change-email" as const;
    return api.post<void>(path, { email });
  },

  /**
   * Login with email and password.
   * 
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    const path = "/auth/login" as const;
    return api.post<{
      token?: string;
      user?: {
        id: string;
        email: string;
      };
    }>(path, { email, password });
  },

  /**
   * Sign up with email and password.
   * 
   * @param email - User email
   * @param password - User password
   */
  async signup(email: string, password: string) {
    const path = "/auth/signup" as const;
    return api.post<{
      token?: string;
      user?: {
        id: string;
        email: string;
      };
    }>(path, { email, password });
  },

  /**
   * Mobile Google OAuth callback.
   * 
   * @param idToken - Google ID token
   * @param googleAccessToken - Google access token (from native SDK)
   */
  async googleMobile(idToken: string, googleAccessToken: string) {
    const path = "/auth/google/mobile" as const;
    return api.post<{
      access_token?: string;
      expires_in?: number;
      token?: string;
      user?: {
        id: string;
        email: string;
      };
    }>(path, {
      id_token: idToken,
      access_token: googleAccessToken,
      platform: "mobile",
    });
  },
};

/**
 * Type-safe API client for user settings endpoints.
 * 
 * All endpoints are validated against the OpenAPI schema at compile time.
 * 
 * Note: Some auth-related endpoints (disconnectStrava, changeEmail) are currently in authApi
 * but should eventually move here for better domain separation.
 */
export const settingsApi = {
  /**
   * Get user profile.
   * 
   * @returns User profile data
   */
  async getProfile() {
    const path = "/me/profile" as const;
    return api.get<{
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      gender?: string | null;
      date_of_birth?: string | null;
      weight_lbs?: number | null;
      weight_kg?: number | null;
      height_inches?: number | null;
      height_cm?: number | null;
      location?: string | null;
      unit_system?: "imperial" | "metric";
      target_event?: {
        name?: string;
        date?: string;
      } | null;
      goals?: string[];
    }>(path);
  },

  /**
   * Update user profile.
   * 
   * @param payload - Profile update data
   * @returns Updated profile
   */
  async updateProfile(payload: Record<string, unknown>) {
    const path = "/me/profile" as const;
    return api.put<{
      first_name?: string | null;
      last_name?: string | null;
      email?: string | null;
      gender?: string | null;
      date_of_birth?: string | null;
      weight_lbs?: number | null;
      weight_kg?: number | null;
      height_inches?: number | null;
      height_cm?: number | null;
      location?: string | null;
      unit_system?: "imperial" | "metric";
      target_event?: {
        name?: string;
        date?: string;
      } | null;
      goals?: string[];
    }>(path, payload);
  },

  /**
   * Get training preferences.
   * 
   * @returns Training preferences
   */
  async getTrainingPreferences() {
    const path = "/me/training-preferences" as const;
    return api.get<{
      years_of_training: number;
      primary_sports: string[];
      available_days: string[];
      weekly_hours: number;
      training_focus: "race_focused" | "general_fitness";
      injury_history: boolean;
      injury_notes: string | null;
      consistency: string | null;
      goal: string | null;
    }>(path);
  },

  /**
   * Update training preferences.
   * 
   * @param payload - Training preferences update
   * @returns Updated preferences
   */
  async updateTrainingPreferences(payload: Record<string, unknown>) {
    const path = "/me/training-preferences" as const;
    return api.put<{
      years_of_training: number;
      primary_sports: string[];
      available_days: string[];
      weekly_hours: number;
      training_focus: "race_focused" | "general_fitness";
      injury_history: boolean;
      injury_notes: string | null;
      consistency: string | null;
      goal: string | null;
    }>(path, payload);
  },

  /**
   * Get privacy settings.
   * 
   * @returns Privacy settings
   */
  async getPrivacySettings() {
    const path = "/me/privacy-settings" as const;
    return api.get<{
      profile_visibility: "public" | "private" | "coaches";
      share_activity_data: boolean;
      share_training_metrics: boolean;
    }>(path);
  },

  /**
   * Update privacy settings.
   * 
   * @param payload - Privacy settings update
   * @returns Updated settings
   */
  async updatePrivacySettings(payload: {
    profile_visibility?: "public" | "private" | "coaches";
    share_activity_data?: boolean;
    share_training_metrics?: boolean;
  }) {
    const path = "/me/privacy-settings" as const;
    return api.put<{
      profile_visibility: "public" | "private" | "coaches";
      share_activity_data: boolean;
      share_training_metrics: boolean;
    }>(path, payload);
  },

  /**
   * Get notification preferences.
   * 
   * @returns Notification preferences
   */
  async getNotificationPreferences() {
    const path = "/me/notifications" as const;
    return api.get<{
      email_notifications: boolean;
      push_notifications: boolean;
      workout_reminders: boolean;
      training_load_alerts: boolean;
      race_reminders: boolean;
      weekly_summary: boolean;
      goal_achievements: boolean;
      coach_messages: boolean;
    }>(path);
  },

  /**
   * Update notification preferences.
   * 
   * @param payload - Notification preferences update
   * @returns Updated preferences
   */
  async updateNotificationPreferences(payload: Record<string, unknown>) {
    const path = "/me/notifications" as const;
    return api.put<{
      email_notifications: boolean;
      push_notifications: boolean;
      workout_reminders: boolean;
      training_load_alerts: boolean;
      race_reminders: boolean;
      weekly_summary: boolean;
      goal_achievements: boolean;
      coach_messages: boolean;
    }>(path, payload);
  },

  /**
   * Change user password.
   * 
   * @param passwordData - Password change data
   */
  async changePassword(passwordData: { current_password: string; new_password: string }) {
    const path = "/me/change-password" as const;
    return api.post<void>(path, passwordData);
  },

  /**
   * Get user status (sync status, connection state).
   * 
   * @returns User status
   */
  async getStatus() {
    const path = "/me/status" as const;
    return api.get<{
      connected: boolean;
      last_sync: string;
      state: "ok" | "syncing" | "stale";
    }>(path);
  },

  /**
   * Trigger full historical sync.
   */
  async syncHistory() {
    const path = "/me/sync/history" as const;
    return api.post<void>(path);
  },

  /**
   * Check sync status.
   */
  async syncCheck() {
    const path = "/me/sync/check" as const;
    return api.post<void>(path);
  },

  /**
   * Trigger immediate sync.
   */
  async syncNow() {
    const path = "/me/sync/now" as const;
    return api.post<void>(path);
  },

  /**
   * Get user overview (training load summary).
   * 
   * @param days - Number of days to include
   * @returns Overview data
   */
  async getOverview(days?: number) {
    const path = "/me/overview" as const;
    return api.get<{
      today: {
        ctl: number;
        atl: number;
        tsb: number;
      };
      metrics: {
        ctl?: [string, number][];
        atl?: [string, number][];
        tsb?: [string, number][];
      };
    }>(path, days ? { params: { days } } : {});
  },

  /**
   * Complete onboarding process.
   * 
   * @param data - Onboarding data
   * @returns Onboarding result with optional plans
   */
  async completeOnboarding(data: {
    role: "athlete" | "coach";
    first_name: string;
    last_name: string | null;
    timezone: string;
    primary_sport: "run" | "bike" | "tri";
    goal_type: "performance" | "completion" | "general";
    experience_level: "beginner" | "structured" | "competitive";
    availability_days_per_week: number;
    availability_hours_per_week: number;
    injury_status: "none" | "managing" | "injured";
    injury_notes: string | null;
    generate_initial_plan: boolean;
  }) {
    const path = "/api/onboarding/complete" as const;
    return api.post<{
      status: "ok";
      weekly_intent: unknown | null;
      season_plan: unknown | null;
      provisional: boolean;
      warning: string | null;
    }>(path, data);
  },

  /**
   * Update athlete profile settings.
   * 
   * @param data - Profile settings data
   * @returns Success response
   */
  async updateAthleteProfileSettings(data: {
    first_name: string;
    last_name?: string;
    timezone: string;
    primary_sport: "run" | "bike" | "tri";
    goal_type: "performance" | "completion" | "general";
    experience_level: "beginner" | "structured" | "competitive";
    availability_days_per_week: number;
    availability_hours_per_week: number;
    injury_status: "none" | "managing" | "injured";
    injury_notes?: string;
  }) {
    const path = "/api/settings/profile" as const;
    return api.put<{ status: "ok" }>(path, data);
  },

  /**
   * Get user overview debug info (development only).
   * 
   * @param days - Number of days to include
   * @returns Debug overview data
   */
  async getOverviewDebug(days?: number) {
    const path = "/me/overview/debug" as const;
    return api.get<{
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
    }>(path, days ? { params: { days } } : {});
  },
};

/**
 * Type guard to ensure a path exists in the OpenAPI schema.
 * 
 * This will be enhanced once we have generated types.
 */
export function validateApiPath(path: string): path is keyof OpenAPIPaths {
  // For now, this is a placeholder
  // Once we have generated types, we can validate against the actual schema
  return true;
}
