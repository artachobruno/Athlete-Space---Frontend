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
 * In production: Fetches from backend API GET /api/coach/athletes
 * 
 * Backend response format: { athletes: Array<{ id, name, avatar_initials }> }
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
      
      // Backend may return { athletes: [...] } or just [...]
      if (response && typeof response === 'object' && 'athletes' in response) {
        const athletesArray = (response as { athletes: unknown[] }).athletes;
        if (Array.isArray(athletesArray)) {
          return athletesArray.map((athlete: unknown) => {
            const a = athlete as Record<string, unknown>;
            // Map backend format to frontend format
            return {
              id: String(a.id || ''),
              name: String(a.name || ''),
              email: typeof a.email === 'string' ? a.email : undefined,
              avatar_url: typeof a.avatar_url === 'string' ? a.avatar_url : undefined,
              avatar_initials: typeof (a as { avatar_initials?: string }).avatar_initials === 'string'
                ? (a as { avatar_initials: string }).avatar_initials
                : undefined,
              last_activity_date: typeof a.last_activity_date === 'string' 
                ? a.last_activity_date 
                : undefined,
            } as CoachAthlete;
          });
        }
      }
      
      // If response is directly an array
      if (Array.isArray(response)) {
        return response.map((athlete: unknown) => {
          const a = athlete as Record<string, unknown>;
          return {
            id: String(a.id || ''),
            name: String(a.name || ''),
            email: typeof a.email === 'string' ? a.email : undefined,
            avatar_url: typeof a.avatar_url === 'string' ? a.avatar_url : undefined,
            avatar_initials: typeof (a as { avatar_initials?: string }).avatar_initials === 'string'
              ? (a as { avatar_initials: string }).avatar_initials
              : undefined,
            last_activity_date: typeof a.last_activity_date === 'string' 
              ? a.last_activity_date 
              : undefined,
          } as CoachAthlete;
        });
      }
      
      // Fallback: return empty array if response format is unexpected
      console.warn('[useCoachAthletes] Unexpected response format:', response);
      return [];
    },
    enabled: IS_PREVIEW || isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to access coach dashboard data for a specific athlete
 * 
 * In preview mode: Returns mock data for the selected athlete
 * In production: Calls GET /api/coach/athletes/{athlete_id}/dashboard
 * 
 * Returns CoachDashboardData directly (with defaults during loading)
 * Components can access isLoading and error via separate properties if needed
 */
export function useCoachDashboardData(athleteId?: string): CoachDashboardData & { isLoading?: boolean; error?: unknown } {
  const { status } = useAuth();
  const isAuthenticated = status === 'authenticated';

  const query = useQuery({
    queryKey: ['coach', 'dashboard', athleteId],
    queryFn: async (): Promise<CoachDashboardData> => {
      if (IS_PREVIEW) {
        // Return athlete-specific mock data if available
        if (athleteId && mockAthleteDashboardData[athleteId]) {
          return mockAthleteDashboardData[athleteId];
        }
        return mockCoachDashboardData;
      }

      if (!athleteId) {
        // Return default data when no athleteId (component should handle this)
        return mockCoachDashboardData;
      }

      // Call real API: GET /api/coach/athletes/{athlete_id}/dashboard
      const response = await api.get(`/coach/athletes/${athleteId}/dashboard`);
      
      // Backend response should match CoachDashboardData interface
      const dashboardData = response as unknown as CoachDashboardData;
      
      // Validate required fields exist
      if (!dashboardData || typeof dashboardData !== 'object') {
        throw new Error('Invalid dashboard data response from API');
      }

      return {
        adherence_pct: typeof dashboardData.adherence_pct === 'number' 
          ? dashboardData.adherence_pct 
          : 0,
        adherence_trend: Array.isArray(dashboardData.adherence_trend)
          ? dashboardData.adherence_trend
          : [],
        load_trend: dashboardData.load_trend || 'stable',
        risk_level: dashboardData.risk_level || 'low',
        risks: Array.isArray(dashboardData.risks) ? dashboardData.risks : [],
        weekly_loads: Array.isArray(dashboardData.weekly_loads) 
          ? dashboardData.weekly_loads 
          : [],
      };
    },
    enabled: (IS_PREVIEW || isAuthenticated) && !!athleteId,
    staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data changes more frequently
    retry: 1, // Only retry once on failure
  });

  // Return data with defaults during loading/error states for backward compatibility
  const defaultData: CoachDashboardData = athleteId && mockAthleteDashboardData[athleteId] 
    ? mockAthleteDashboardData[athleteId] 
    : mockCoachDashboardData;

  if (query.isLoading || !query.data) {
    return {
      ...defaultData,
      isLoading: true,
    };
  }

  if (query.error) {
    return {
      ...defaultData,
      isLoading: false,
      error: query.error,
    };
  }

  return {
    ...query.data,
    isLoading: false,
  };
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
