/**
 * Runtime Validation with Zod
 * 
 * TypeScript types are compile-time only. This file provides runtime validation
 * to catch schema mismatches, broken migrations, and backend bugs.
 * 
 * These schemas should match the backend Pydantic models exactly.
 * If backend changes → regenerate types → update schemas here.
 */

import { z } from "zod";

// ============================================================================
// PROFILE SCHEMAS
// ============================================================================

/**
 * User profile schema (matches backend AthleteProfileOut)
 * This validates the response from /me/profile
 */
export const AthleteProfileOutSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  gender: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  weight_kg: z.number().nullable().optional(),
  weight_lbs: z.number().nullable().optional(),
  height_cm: z.number().nullable().optional(),
  height_in: z.number().nullable().optional(),
  location: z.string().nullable(),
  unit_system: z.enum(['imperial', 'metric']).nullable(),
  onboarding_complete: z.boolean(),
  target_event: z.object({
    name: z.string(),
    date: z.string(),
    distance: z.string().nullable().optional(),
  }).nullable(),
  goals: z.array(z.string()),
  strava_connected: z.boolean(),
});

export type AthleteProfileOut = z.infer<typeof AthleteProfileOutSchema>;

/**
 * User schema (matches backend UserOut from /me)
 * This validates the response from /me (required endpoint)
 */
export const UserOutSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  onboarding_complete: z.boolean(),
  strava_connected: z.boolean(),
  timezone: z.string().optional(), // IANA timezone string (e.g., "America/Chicago")
  // Add other fields from /me endpoint as needed
});

export type UserOut = z.infer<typeof UserOutSchema>;

// ============================================================================
// TRAINING PREFERENCES SCHEMAS
// ============================================================================

export const TrainingPreferencesOutSchema = z.object({
  years_of_training: z.number(),
  primary_sports: z.array(z.string()),
  available_days: z.array(z.string()),
  weekly_hours: z.number(),
  training_focus: z.enum(['race_focused', 'general_fitness']),
  injury_history: z.boolean(),
  injury_notes: z.string().nullable(),
  consistency: z.string().nullable(),
  goal: z.string().nullable(),
});

export type TrainingPreferencesOut = z.infer<typeof TrainingPreferencesOutSchema>;

// ============================================================================
// ACTIVITY SCHEMAS
// ============================================================================

export const ActivityOutSchema = z.object({
  id: z.string(),
  start_time: z.string(),
  type: z.string(),
  title: z.string().nullable(),
  duration_seconds: z.number().nullable(),
  distance_meters: z.number().nullable(),
  elevation_gain_meters: z.number().nullable(),
  average_speed: z.number().nullable(),
  average_heartrate: z.number().nullable(),
  average_watts: z.number().nullable(),
  training_load: z.number().nullable(),
  coach_feedback: z.string().nullable(),
  strava_activity_id: z.string().nullable(),
  normalized_power: z.number().nullable().optional(),
  intensity_factor: z.number().nullable().optional(),
  effort_source: z.enum(['power', 'pace', 'hr']).nullable().optional(),
});

export type ActivityOut = z.infer<typeof ActivityOutSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates API response against schema.
 * Throws error if validation fails (schema mismatch).
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  endpoint: string
): T {
  const parsed = schema.safeParse(data);
  
  if (!parsed.success) {
    console.error(`[Validation] Schema mismatch for ${endpoint}:`, parsed.error);
    throw new Error(
      `API schema mismatch for ${endpoint}. ` +
      `This usually means backend schema changed but frontend types weren't regenerated. ` +
      `Run: npm run generate-types`
    );
  }
  
  return parsed.data;
}

/**
 * Safe validation - returns null instead of throwing.
 * Use for optional endpoints.
 */
export function safeValidateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  endpoint: string
): T | null {
  const parsed = schema.safeParse(data);
  
  if (!parsed.success) {
    console.warn(`[Validation] Schema mismatch for ${endpoint} (optional):`, parsed.error);
    return null;
  }
  
  return parsed.data;
}

