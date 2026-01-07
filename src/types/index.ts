// Core application types

export type Sport = 'running' | 'cycling' | 'swimming' | 'triathlon';

export type WorkoutIntent = 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery';

export type DailyDecision = 'proceed' | 'modify' | 'replace' | 'rest';

export type LoadStatus = 'fresh' | 'optimal' | 'overreaching' | 'overtraining';

export interface AthleteProfile {
  id: string;
  name: string;
  sports: Sport[];
  trainingAge: number; // years of structured training
  weeklyAvailability: {
    days: number;
    hoursPerWeek: number;
  };
  goals: string[];
  targetEvent?: {
    name: string;
    date: string;
    distance?: string;
  };
  stravaConnected: boolean;
  onboardingComplete: boolean;
  // Optional profile fields
  email?: string;
  gender?: string;
  dateOfBirth?: string;
  weight?: number | string;
  height?: number | string;
  location?: string;
  unitSystem?: 'imperial' | 'metric';
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
  coachFeedback?: string;
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
  data: Partial<AthleteProfile>;
  messages: ChatMessage[];
}

export interface CoachContext {
  data_confidence: number; // 0.0 – 1.0
  summary_hint?: 'consistent' | 'fatigue' | 'insufficient';
}
