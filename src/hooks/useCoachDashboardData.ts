import { mockCoachDashboardData, type CoachDashboardData } from '@/mock/coachDashboard.mock';

/**
 * Environment flag for preview mode
 * Preview mode enables mock data without backend calls
 */
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW_MODE === 'true' || 
  (typeof window !== 'undefined' && window.location.hostname.includes('lovable'));

/**
 * Hook to access coach dashboard data
 * 
 * In preview mode: Returns mock data
 * In production: Will call backend API (not wired yet)
 */
export function useCoachDashboardData(): CoachDashboardData {
  if (IS_PREVIEW) {
    return mockCoachDashboardData;
  }

  // When real API is available, replace this with actual data fetching
  // For now, throw error to make it obvious when preview mode is not set
  throw new Error(
    'Coach dashboard API not wired yet. Set VITE_PREVIEW_MODE=true for development.'
  );
}
