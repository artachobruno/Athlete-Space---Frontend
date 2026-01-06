// Local storage utilities for persistence

const STORAGE_KEYS = {
  ATHLETE_PROFILE: 'coach_athlete_profile',
  ONBOARDING_STATE: 'coach_onboarding_state',
  ACTIVITIES: 'coach_activities',
  TRAINING_LOAD: 'coach_training_load',
  WEEKLY_PLANS: 'coach_weekly_plans',
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

export function getTrainingLoad(): import('@/types').TrainingLoad[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TRAINING_LOAD);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

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

export function clearAllData(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
