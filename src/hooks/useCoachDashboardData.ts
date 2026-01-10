import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  mockCoachDashboardData, 
  mockCoachAthletes, 
  mockAthleteDashboardData,
  type CoachDashboardData,
  type CoachAthlete 
} from '@/mock/coachDashboard.mock';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

/**
 * Environment flag for preview mode
 * Preview mode enables mock data without backend calls
 */
export const IS_PREVIEW = import.meta.env.VITE_PREVIEW_MODE === 'true' || 
  (typeof window !== 'undefined' && window.location.hostname.includes('lovable'));

/**
 * Hook to fetch coach's assigned athletes
 * 
 * In preview mode: Returns mock athletes
 * In production: Fetches from backend API
 */
export function useCoachAthletes() {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  return useQuery({
    queryKey: ['coach', 'athletes'],
    queryFn: async (): Promise<CoachAthlete[]> => {
      if (IS_PREVIEW) {
        // Simulate network delay in preview
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockCoachAthletes;
      }
      
      const response = await api.get('/coach/athletes');
      return response as unknown as CoachAthlete[];
    },
    enabled: IS_PREVIEW || isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to access coach dashboard data for a specific athlete
 * 
 * In preview mode: Returns mock data for the selected athlete
 * In production: Will call backend API with athlete_id
 */
export function useCoachDashboardData(athleteId?: string): CoachDashboardData {
  if (IS_PREVIEW) {
    // Return athlete-specific mock data if available
    if (athleteId && mockAthleteDashboardData[athleteId]) {
      return mockAthleteDashboardData[athleteId];
    }
    return mockCoachDashboardData;
  }

  // When real API is available, this would fetch data for the specific athlete
  // For now, throw error to make it obvious when preview mode is not set
  throw new Error(
    'Coach dashboard API not wired yet. Set VITE_PREVIEW_MODE=true for development.'
  );
}

/**
 * Hook to manage athlete selection state
 * Returns the selected athlete and a setter function
 */
export function useAthleteSelection() {
  const { data: athletes, isLoading } = useCoachAthletes();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);

  // Auto-select first athlete when data loads
  useEffect(() => {
    if (athletes && athletes.length > 0 && !selectedAthleteId) {
      setSelectedAthleteId(athletes[0].id);
    }
  }, [athletes, selectedAthleteId]);

  const selectedAthlete = athletes?.find(a => a.id === selectedAthleteId) ?? null;

  return {
    athletes: athletes ?? [],
    selectedAthlete,
    selectedAthleteId,
    setSelectedAthleteId,
    isLoading,
  };
}
