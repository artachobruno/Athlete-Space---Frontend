// Local storage utilities for persistence

const STORAGE_KEYS = {
  ATHLETE_PROFILE: 'coach_athlete_profile',
  ONBOARDING_STATE: 'coach_onboarding_state',
  ONBOARDING_ADDITIONAL_DATA: 'onboarding_additional_data',
  ACTIVITIES: 'coach_activities',
  TRAINING_LOAD: 'coach_training_load',
  WEEKLY_PLANS: 'coach_weekly_plans',
  SEASON_PLAN: 'coach_season_plan',
  ONBOARDING_PLANS: 'onboarding_plans', // Store plans from onboarding response
} as const;

export function getStoredProfile(): import('@/types').AthleteProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ATHLETE_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: import('@/types').AthleteProfile): void {
  localStorage.setItem(STORAGE_KEYS.ATHLETE_PROFILE, JSON.stringify(profile));
}

export function getOnboardingState(): import('@/types').OnboardingState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STATE);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveOnboardingState(state: import('@/types').OnboardingState): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_STATE, JSON.stringify(state));
}

export function clearOnboardingState(): void {
  localStorage.removeItem(STORAGE_KEYS.ONBOARDING_STATE);
}

export interface OnboardingAdditionalData {
  consistency: string;
  raceDetails: string;
  injuryDetails: string;
  collectedAt: string;
}

export function getOnboardingAdditionalData(): OnboardingAdditionalData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_ADDITIONAL_DATA);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveOnboardingAdditionalData(data: OnboardingAdditionalData): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_ADDITIONAL_DATA, JSON.stringify(data));
}

export function getActivities(): import('@/types').CompletedActivity[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITIES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveActivities(activities: import('@/types').CompletedActivity[]): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

/**
 * @deprecated DO NOT USE - Training load should always be fetched fresh from API.
 * Using localStorage for training load causes stale metrics to persist.
 * Training load data changes frequently and must always come from the backend.
 */
export function getTrainingLoad(): import('@/types').TrainingLoad[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRAINING_LOAD);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * @deprecated DO NOT USE - Training load should always be fetched fresh from API.
 * Using localStorage for training load causes stale metrics to persist.
 * Training load data changes frequently and must always come from the backend.
 */
export function saveTrainingLoad(load: import('@/types').TrainingLoad[]): void {
  localStorage.setItem(STORAGE_KEYS.TRAINING_LOAD, JSON.stringify(load));
}

export function getWeeklyPlans(): import('@/types').WeeklyPlan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WEEKLY_PLANS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveWeeklyPlans(plans: import('@/types').WeeklyPlan[]): void {
  localStorage.setItem(STORAGE_KEYS.WEEKLY_PLANS, JSON.stringify(plans));
}

export interface OnboardingPlans {
  weekly_intent: any | null;
  season_plan: any | null;
  provisional: boolean;
  warning: string | null;
  savedAt: string;
}

export function getOnboardingPlans(): OnboardingPlans | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PLANS);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveOnboardingPlans(plans: OnboardingPlans): void {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_PLANS, JSON.stringify(plans));
}

/**
 * Marks onboarding as completed in localStorage.
 * This is a safeguard against backend bugs that reset onboarding_complete.
 */
export function markOnboardingCompleted(): void {
  localStorage.setItem('onboarding_completed_flag', 'true');
  localStorage.setItem('onboarding_completed_at', new Date().toISOString());
}

/**
 * Checks if onboarding was ever completed (localStorage flag).
 * This is a safeguard against backend bugs that reset onboarding_complete.
 */
export function wasOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem('onboarding_completed_flag') === 'true';
  } catch {
    return false;
  }
}

export function getSeasonPlan(): any | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SEASON_PLAN);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveSeasonPlan(plan: any): void {
  localStorage.setItem(STORAGE_KEYS.SEASON_PLAN, JSON.stringify(plan));
}

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
