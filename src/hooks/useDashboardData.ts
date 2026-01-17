import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { fetchCalendarToday, fetchTrainingLoad, fetchActivities, fetchOverview, fetchCalendarWeek } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { format, startOfWeek } from 'date-fns';
import type { TrainingLoadData } from '@/lib/tss-utils';

/**
 * Centralized hook to fetch all dashboard data.
 * 
 * This prevents duplicate requests by:
 * 1. Using consistent query keys across components
 * 2. Proper staleTime to enable React Query caching
 * 3. Single source of truth for dashboard data
 */
export function useDashboardData() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  // Fetch today's calendar data
  const todayData = useAuthenticatedQuery({
    queryKey: ['calendarToday', today],
    queryFn: () => fetchCalendarToday(today),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - today's workout can change
    gcTime: 10 * 60 * 1000,
  });

  // Fetch training load for 7 days (shared by TodayWorkoutCard and WeeklyLoadCard)
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

  // Fetch training load for 60 days (shared by RecentActivitiesCard and LoadStatusCard)
  const trainingLoad60d = useAuthenticatedQuery<TrainingLoadData>({
    queryKey: ['trainingLoad', 60],
    queryFn: () => fetchTrainingLoad(60),
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
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch activities with limit 10 (used by TodayWorkoutCard and RecentActivitiesCard)
  // Using consistent query key so components share cache
  const activities10 = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 10],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes - recent activities can change
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch activities with limit 100 (used by WeeklyLoadCard)
  const activities100 = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - activities don't change that frequently
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch overview for 60 days (used by LoadStatusCard)
  const overview60d = useAuthenticatedQuery({
    queryKey: ['overview', 60],
    queryFn: () => fetchOverview(60),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch calendar week (used by WeeklyLoadCard)
  const weekData = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
  });

  // Fetch today's intelligence (used by TodayWorkoutCard)
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

    trainingLoad60d: trainingLoad60d.data,
    trainingLoad60dLoading: trainingLoad60d.isLoading,
    trainingLoad60dError: trainingLoad60d.error,

    activities10: activities10.data,
    activities10Loading: activities10.isLoading,
    activities10Error: activities10.error,

    activities100: activities100.data,
    activities100Loading: activities100.isLoading,
    activities100Error: activities100.error,

    overview60d: overview60d.data,
    overview60dLoading: overview60d.isLoading,
    overview60dError: overview60d.error,

    weekData: weekData.data,
    weekDataLoading: weekData.isLoading,
    weekDataError: weekData.error,

    todayIntelligence: todayIntelligence.data,
    todayIntelligenceLoading: todayIntelligence.isLoading,
    todayIntelligenceError: todayIntelligence.error,

    // Overall loading state - true if any critical query is loading
    isLoading: todayData.isLoading || trainingLoad7d.isLoading || 
               trainingLoad60d.isLoading || activities10.isLoading || 
               activities100.isLoading || overview60d.isLoading || 
               weekData.isLoading || todayIntelligence.isLoading,
  };
}
