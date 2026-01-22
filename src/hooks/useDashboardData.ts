import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { fetchCalendarToday, fetchTrainingLoad, fetchActivities } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { format } from 'date-fns';
import type { TrainingLoadData } from '@/lib/tss-utils';

/**
 * Centralized hook to fetch dashboard data for the Today page.
 * 
 * After IA consolidation (Phase 5), this hook provides only data needed for:
 * - DailyDecisionCard (todayIntelligence)
 * - TodayWorkoutCard (todayData, trainingLoad7d, activities10, todayIntelligence)
 * 
 * Removed queries (moved to other pages or no longer used):
 * - trainingLoad60d → Insights page fetches directly
 * - activities100 → WeeklyLoadCard removed
 * - overview60d → Insights page fetches directly  
 * - weekData → Plan page uses SeasonView directly
 */
export function useDashboardData() {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's calendar data (used by TodayWorkoutCard)
  const todayData = useAuthenticatedQuery({
    queryKey: ['calendarToday', today],
    queryFn: () => fetchCalendarToday(today),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - today's workout can change
    gcTime: 10 * 60 * 1000,
  });

  // Fetch training load for 7 days (used by TodayWorkoutCard)
  const trainingLoad7d = useAuthenticatedQuery<TrainingLoadData>({
    queryKey: ['trainingLoad', 7],
    queryFn: () => fetchTrainingLoad(7),
    retry: (failureCount, error) => {
      if (error && typeof error === 'object') {
        const apiError = error as { code?: string; message?: string; status?: number };
        if (apiError.status === 500 || apiError.status === 503 ||
            apiError.code === 'ECONNABORTED' || 
            (apiError.message && apiError.message.includes('timed out'))) {
          return false;
        }
      }
      return failureCount < 1;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - training load updates reasonably quickly
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch activities with limit 10 (used by TodayWorkoutCard)
  const activities10 = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 10],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - recent activities can change
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch today's intelligence (used by DailyDecisionCard and TodayWorkoutCard)
  // This is expensive (LLM call), so longer staleTime
  const todayIntelligence = useAuthenticatedQuery({
    queryKey: ['intelligence', 'today', 'current'],
    queryFn: () => getTodayIntelligence(),
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - intelligence is expensive LLM call
    gcTime: 60 * 60 * 1000,
  });

  return {
    todayData: todayData.data,
    todayDataLoading: todayData.isLoading,
    todayDataError: todayData.error,

    trainingLoad7d: trainingLoad7d.data,
    trainingLoad7dLoading: trainingLoad7d.isLoading,
    trainingLoad7dError: trainingLoad7d.error,

    activities10: activities10.data,
    activities10Loading: activities10.isLoading,
    activities10Error: activities10.error,

    todayIntelligence: todayIntelligence.data,
    todayIntelligenceLoading: todayIntelligence.isLoading,
    todayIntelligenceError: todayIntelligence.error,

    // Overall loading state - true if any critical query is loading
    isLoading: todayData.isLoading || trainingLoad7d.isLoading || 
               activities10.isLoading || todayIntelligence.isLoading,
  };
}
