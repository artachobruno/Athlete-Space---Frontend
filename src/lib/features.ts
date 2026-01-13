/**
 * Feature flags for enabling/disabling features in the application.
 * This allows safe rollout of new features and easy toggling in production.
 */
export const FEATURES = {
  /**
   * Enable workout notes parsing into structured steps.
   * When disabled, parsing UI is hidden and no parsing calls are made.
   */
  workoutNotesParsing: false,
} as const;
