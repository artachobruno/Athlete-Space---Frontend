// Core application types

export type Sport = 'running' | 'cycling' | 'swimming' | 'triathlon';

export type WorkoutIntent = 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery';

export type DailyDecision = 'proceed' | 'modify' | 'replace' | 'rest';

export type LoadStatus = 'fresh' | 'optimal' | 'overreaching' | 'overtraining';

/**
 * AthleteProfile interface for user profile data.
 * Supports both snake_case (backend) and camelCase (frontend) properties.
 */
export interface AthleteProfile {
  id?: string;
  user_id?: string;
  name?: string;
  email?: string;
  gender?: string;
  
  // Date of birth - both cases
  date_of_birth?: string;
  dateOfBirth?: string;
  
  // Weight - both cases and unit systems
  weight_kg?: number;
  weight_lbs?: number;
  weight?: number;
  
  // Height - both cases and unit systems
  height_cm?: number;
  height_in?: number;
  height?: number;
  
  location?: string;
  
  // Unit system - both cases
  unit_system?: 'imperial' | 'metric';
  unitSystem?: 'imperial' | 'metric';
  
  // Onboarding complete - both cases
  onboarding_complete?: boolean;
  onboardingComplete?: boolean;
  
  // Strava connected - both cases
  strava_connected?: boolean;
  stravaConnected?: boolean;
  
  // Target event - both cases
  target_event?: {
    name?: string;
    date?: string;
  } | null;
  targetEvent?: {
    name?: string;
    date?: string;
  } | null;
  
  // Training data
  goals?: string[];
  sports?: Sport[];
  trainingAge?: number | string;
  
  // Weekly availability
  weeklyAvailability?: {
    hoursPerWeek?: number;
    daysPerWeek?: number;
    days?: number[];
  };
}

export interface PlannedWorkout {
  id: string;
  date: string;
  sport: Sport;
  intent: WorkoutIntent;
  title: string;
  description: string;
  duration: number; // minutes
  distance?: number; // km
  structure?: WorkoutStructure[];
  completed: boolean;
  actualActivityId?: string;
}

export interface WorkoutStructure {
  type: 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery';
  duration?: number; // minutes
  distance?: number; // km
  intensity?: string; // e.g., "Zone 2", "Threshold pace"
  notes?: string;
}

export interface CompletedActivity {
  id: string;
  date: string;
  sport: Sport;
  title: string;
  duration: number; // minutes
  distance: number; // km
  avgPace?: string;
  avgHeartRate?: number;
  avgPower?: number;
  elevation?: number;
  trainingLoad: number; // TSS equivalent
  source: 'strava' | 'manual';
  workout_id?: string; // Link to canonical Workout
  planned_session_id?: string | null; // Link to planned session (activity is paired if this is non-null)
  coachFeedback?: string;
  normalizedPower?: number; // Normalized Power (cycling) or Normalized Effort (running)
  intensityFactor?: number; // Intensity Factor (IF)
  effortSource?: 'power' | 'pace' | 'hr'; // Source of effort calculation
}

export interface TrainingLoad {
  date: string;
  atl: number; // Acute Training Load (fatigue)
  ctl: number; // Chronic Training Load (fitness)
  tsb: number; // Training Stress Balance (form)
  dailyLoad: number;
}

export interface WeeklyPlan {
  weekStart: string;
  weekEnd: string;
  plannedLoad: number;
  actualLoad: number;
  workouts: PlannedWorkout[];
  coachNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'coach' | 'athlete';
  content: string;
  timestamp: string;
  type?: 'text' | 'strava-connect' | 'plan-preview';
}

export interface OnboardingState {
  step: 'welcome' | 'sports' | 'experience' | 'goals' | 'availability' | 'strava' | 'analysis' | 'plan' | 'complete';
  data: Partial<Omit<AthleteProfile, 'sports'> & { sports?: Sport[] }>;
  messages: ChatMessage[];
}

export interface CoachContext {
  data_confidence: number; // 0.0 – 1.0
  summary_hint?: 'consistent' | 'fatigue' | 'insufficient';
}

/**
 * Phase 6B: Execution & Conflict UX Types
 */

/**
 * Session within a week plan for execution preview
 */
export interface PlanSession {
  session_id: string;
  date: string; // Resolved date (YYYY-MM-DD)
  type: 'easy' | 'tempo' | 'long' | 'workout' | 'recovery' | 'rest';
  duration: number; // minutes
  distance?: number; // km (derived miles)
  template_name: string; // Human readable template name
  notes?: string; // Coach text
}

/**
 * Week plan for execution (from Phase 5)
 */
export interface WeekPlan {
  week: number; // Week number (1-based)
  weekStart: string; // Week start date (YYYY-MM-DD)
  weekEnd: string; // Week end date (YYYY-MM-DD)
  sessions: PlanSession[];
  coachNotes?: string;
}

/**
 * Conflict detected during execution preview
 */
export interface ExecutionConflict {
  session_id: string;
  existing_session_id: string;
  date: string; // YYYY-MM-DD
  reason: 'overlap' | 'manual_edit';
}

/**
 * Execution preview response from backend
 */
export interface ExecutionPreviewResponse {
  conflicts: ExecutionConflict[];
}

/**
 * Execution response from backend
 */
export interface ExecutionResponse {
  status: 'success' | 'error';
  message?: string;
  sessions_created?: number;
  weeks_affected?: number;
}
