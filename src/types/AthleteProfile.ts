/**
 * Unified AthleteProfile type for onboarding and settings.
 * 
 * This type represents the single source of truth for athlete profile data.
 * Used by both onboarding completion and settings update endpoints.
 */

export interface AthleteProfile {
  // Identity (stored in users table)
  first_name: string;
  last_name?: string;
  timezone: string;

  // Training Context (stored in athlete_profiles and user_settings)
  primary_sport: "run" | "bike" | "tri";
  goal_type: "performance" | "completion" | "general";
  experience_level: "beginner" | "structured" | "competitive";

  availability_days_per_week: number;
  availability_hours_per_week: number;

  // Health (stored in user_settings)
  injury_status: "none" | "managing" | "injured";
  injury_notes?: string;
}
