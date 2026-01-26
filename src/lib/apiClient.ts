/**
 * Centralized API Client
 * 
 * This is the SINGLE CHOKE POINT for all API calls.
 * Never fetch directly inside components - always use functions from this file.
 * 
 * All functions use safeCall wrapper to handle undefined/null responses gracefully.
 */

import { api } from "./api";
import { safeApiCall } from "./api";
import { authApi, settingsApi, calendarApi } from "./api/typedClient";
import type { paths } from "@/types/api";
import { activitiesApi } from "./api/typedClient";

// Type helpers for OpenAPI-generated types
type Paths = paths;
type GetPath<T extends keyof Paths> = Paths[T];
type GetMethod<T extends keyof Paths, M extends keyof GetPath<T>> = GetPath<T>[M];
type GetResponse<T extends keyof Paths, M extends keyof GetPath<T>> = 
  GetMethod<T, M> extends { responses: { 200: { content: { "application/json": infer R } } } }
    ? R
    : never;

/**
 * Safe call wrapper that handles undefined/null responses.
 * Never assumes success - always checks if result is valid.
 */
export async function safeCall<T>(
  fn: () => Promise<T>
): Promise<T | null> {
  return safeApiCall(fn);
}

// ============================================================================
// AUTH ENDPOINTS
// ============================================================================

/**
 * GET /me
 * REQUIRED endpoint - validates authentication.
 * Returns null if not authenticated or on error.
 */
export async function getMe(): Promise<GetResponse<"/me", "get"> | null> {
  return safeCall(async () => {
    const response = await authApi.getMe();
    const responseData = response.data || response;
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }
    return responseData as GetResponse<"/me", "get">;
  });
}

/**
 * GET /me/profile
 * OPTIONAL endpoint - returns null if profile doesn't exist.
 * User should be redirected to onboarding if profile is missing.
 */
export async function getProfile(): Promise<GetResponse<"/me/profile", "get"> | null> {
  return safeCall(async () => {
    try {
      const response = await settingsApi.getProfile();
      const responseData = response.data || response;
      if (!responseData || typeof responseData !== 'object') {
        return null;
      }
      return responseData as GetResponse<"/me/profile", "get">;
    } catch (error) {
      const apiError = error as { status?: number };
      // 404, 500, 401 all mean profile is not available - return null
      if (apiError.status === 404 || apiError.status === 500 || apiError.status === 401) {
        return null;
      }
      throw error;
    }
  });
}

/**
 * PUT /me/profile
 * Updates user profile.
 */
export async function updateProfile(
  data: GetResponse<"/me/profile", "put">
): Promise<GetResponse<"/me/profile", "put"> | null> {
  return safeCall(async () => {
    const response = await settingsApi.updateProfile(data);
    const responseData = response.data || response;
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }
    return responseData as GetResponse<"/me/profile", "put">;
  });
}

/**
 * PATCH /users/me
 * Updates user settings (e.g., timezone).
 */
export async function updateUserSettings(data: { timezone?: string }): Promise<unknown | null> {
  return safeCall(async () => {
    const response = await api.patch("/users/me", data);
    if (!response || typeof response !== 'object') {
      return null;
    }
    return response;
  });
}

// ============================================================================
// TRAINING PREFERENCES
// ============================================================================

/**
 * GET /me/training-preferences
 * OPTIONAL endpoint.
 */
export async function getTrainingPreferences(): Promise<GetResponse<"/me/training-preferences", "get"> | null> {
  return safeCall(async () => {
    try {
      const response = await settingsApi.getTrainingPreferences();
      const responseData = response.data || response;
      if (!responseData || typeof responseData !== 'object') {
        return null;
      }
      return responseData as GetResponse<"/me/training-preferences", "get">;
    } catch (error) {
      const apiError = error as { status?: number };
      if (apiError.status === 404 || apiError.status === 500) {
        return null;
      }
      throw error;
    }
  });
}

/**
 * PUT /me/training-preferences
 */
export async function updateTrainingPreferences(
  data: GetResponse<"/me/training-preferences", "put">
): Promise<GetResponse<"/me/training-preferences", "put"> | null> {
  return safeCall(async () => {
    const response = await settingsApi.updateTrainingPreferences(data);
    const responseData = response.data || response;
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }
    return responseData as GetResponse<"/me/training-preferences", "put">;
  });
}

// ============================================================================
// ACTIVITIES
// ============================================================================

/**
 * GET /activities
 * Fetches activities with optional pagination.
 */
export async function getActivities(params?: {
  limit?: number;
  offset?: number;
}): Promise<GetResponse<"/activities", "get"> | null> {
  return safeCall(async () => {
    const response = await activitiesApi.list(params);
    const responseData = response.data || response;
    if (!responseData) {
      return null;
    }
    return responseData as GetResponse<"/activities", "get">;
  });
}

/**
 * GET /activities/{id}
 */
export async function getActivity(id: string): Promise<GetResponse<"/activities/{id}", "get"> | null> {
  return safeCall(async () => {
    const response = await activitiesApi.getById(id);
    const responseData = response.data || response;
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }
    return responseData as GetResponse<"/activities/{id}", "get">;
  });
}

// ============================================================================
// CALENDAR
// ============================================================================

/**
 * GET /calendar/today
 * OPTIONAL endpoint.
 */
export async function getCalendarToday(): Promise<GetResponse<"/calendar/today", "get"> | null> {
  return safeCall(async () => {
    try {
      const response = await calendarApi.getToday();
      const responseData = response.data || response;
      if (!responseData || typeof responseData !== 'object') {
        return null;
      }
      return responseData as GetResponse<"/calendar/today", "get">;
    } catch (error) {
      const apiError = error as { status?: number };
      if (apiError.status === 500) {
        return null;
      }
      throw error;
    }
  });
}

/**
 * GET /calendar/week
 * OPTIONAL endpoint.
 */
export async function getCalendarWeek(): Promise<GetResponse<"/calendar/week", "get"> | null> {
  return safeCall(async () => {
    try {
      const response = await calendarApi.getWeek();
      const responseData = response.data || response;
      if (!responseData || typeof responseData !== 'object') {
        return null;
      }
      return responseData as GetResponse<"/calendar/week", "get">;
    } catch (error) {
      const apiError = error as { status?: number };
      if (apiError.status === 500) {
        return null;
      }
      throw error;
    }
  });
}

/**
 * GET /calendar/season
 * OPTIONAL endpoint.
 */
export async function getCalendarSeason(): Promise<GetResponse<"/calendar/season", "get"> | null> {
  return safeCall(async () => {
    try {
      const response = await calendarApi.getSeason();
      const responseData = response.data || response;
      if (!responseData || typeof responseData !== 'object') {
        return null;
      }
      return responseData as GetResponse<"/calendar/season", "get">;
    } catch (error) {
      const apiError = error as { status?: number };
      if (apiError.status === 500) {
        return null;
      }
      throw error;
    }
  });
}

// ============================================================================
// SYNC ENDPOINTS (ALL OPTIONAL)
// ============================================================================

/**
 * GET /me/status
 * OPTIONAL endpoint.
 */
export async function getUserStatus(): Promise<GetResponse<"/me/status", "get"> | null> {
  return safeCall(async () => {
    try {
      const response = await settingsApi.getStatus();
      const responseData = response.data || response;
      if (!responseData || typeof responseData !== 'object') {
        return null;
      }
      return responseData as GetResponse<"/me/status", "get">;
    } catch (error) {
      return null;
    }
  });
}

/**
 * POST /me/sync/history
 * OPTIONAL endpoint.
 */
export async function triggerHistoricalSync(): Promise<GetResponse<"/me/sync/history", "post"> | null> {
  return safeCall(async () => {
    try {
      await settingsApi.syncHistory();
      return { status: "ok" } as GetResponse<"/me/sync/history", "post">;
    } catch (error) {
      return null;
    }
  });
}

/**
 * POST /me/sync/check
 * OPTIONAL endpoint.
 */
export async function checkRecentActivities(): Promise<GetResponse<"/me/sync/check", "post"> | null> {
  return safeCall(async () => {
    try {
      await settingsApi.syncCheck();
      return { status: "ok" } as GetResponse<"/me/sync/check", "post">;
    } catch (error) {
      return null;
    }
  });
}

/**
 * POST /me/sync/now
 * OPTIONAL endpoint.
 */
export async function syncActivitiesNow(): Promise<GetResponse<"/me/sync/now", "post"> | null> {
  return safeCall(async () => {
    try {
      await settingsApi.syncNow();
      return { status: "ok" } as GetResponse<"/me/sync/now", "post">;
    } catch (error) {
      return null;
    }
  });
}

