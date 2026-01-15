/**
 * Workout Card Types
 * 
 * Defines the data contract for workout card rendering.
 */

export type WorkoutCardVariant =
  | 'completed-running'
  | 'planned-running'
  | 'completed-cycling'
  | 'planned-cycling'
  | 'completed-swimming'
  | 'planned-swimming'
  | 'strength';

export interface WorkoutCardData {
  duration: string;
  workoutType: string;
  distance?: string;
  pace?: string;
  title: string;
  description?: string;
  sparkline?: number[]; // normalized 0–1
}
