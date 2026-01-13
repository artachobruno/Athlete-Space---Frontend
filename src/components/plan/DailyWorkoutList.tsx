import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday, isBefore } from 'date-fns';
import { fetchCalendarWeek, fetchActivities, fetchTrainingLoad } from '@/lib/api';
import { mapSessionToWorkout } from '@/lib/session-utils';
import { getTodayIntelligence } from '@/lib/intelligence';
import { DailyWorkoutCard } from './DailyWorkoutCard';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import { enrichActivitiesWithTss } from '@/lib/tss-utils';

interface DailyWorkoutListProps {
  currentDate?: Date;
}

export function DailyWorkoutList({ currentDate }: DailyWorkoutListProps) {
  const today = new Date();
  const viewDate = currentDate || today;
  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData, isLoading: weekLoading } = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  // Use consistent query key to share cache with other components
  const { data: activities, isLoading: activitiesLoading } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: trainingLoadData } = useAuthenticatedQuery({
    queryKey: ['trainingLoad', 14],
    queryFn: () => {
      console.log('[DailyWorkoutList] Fetching training load for 14 days');
      return fetchTrainingLoad(14);
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors or 500 errors (fetchTrainingLoad returns empty response for 500s)
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
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });

  const { data: todayIntelligence } = useAuthenticatedQuery({
    queryKey: ['intelligence', 'today', 'current'],
    queryFn: () => getTodayIntelligence(),
    retry: 1,
    enabled: isToday(today),
    staleTime: 30 * 60 * 1000, // 30 minutes - intelligence is expensive LLM call
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  // Enrich activities with TSS
  const enrichedActivities = useMemo(() => {
    if (!activities) return [];
    return enrichActivitiesWithTss(activities, trainingLoadData);
  }, [activities, trainingLoadData]);

  const weekDays = useMemo(() => {
    // Allow activities even if weekData is not loaded yet
    const activitiesArray = enrichedActivities || [];
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // FE-3: Remove invalid filters - find sessions that aren't explicitly excluded
      const session = weekData?.sessions?.find(s => s.date === dateStr && s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'skipped');
      const workout = session ? mapSessionToWorkout(session) : null;
      
      // Find completed activity - use activities even if not in planned sessions
      const completed = activitiesArray.find((a: CompletedActivity) => {
        if (!a || typeof a !== 'object') return false;
        const activityDate = a.date?.split('T')[0] || a.date;
        return activityDate === dateStr;
      });
      
      // Determine status
      let status: 'upcoming' | 'today' | 'completed' | 'missed' = 'upcoming';
      if (isToday(date)) {
        status = 'today';
      } else if (isBefore(date, today) && !isToday(date)) {
        // If there's a completed activity, mark as completed
        // Otherwise, if there was a planned workout, mark as missed
        status = completed ? 'completed' : (workout ? 'missed' : 'upcoming');
      }

      // Get daily decision for today (only show for actual today, not the viewed week)
      const dailyDecision = isToday(date) && isToday(viewDate) && todayIntelligence ? {
        decision: 'proceed' as const,
        reason: todayIntelligence.explanation || todayIntelligence.recommendation,
      } : null;

      return {
        date,
        dateStr,
        workout,
        completed: completed || undefined,
        status,
        dailyDecision,
      };
    });
  }, [weekData, enrichedActivities, weekStart, today, todayIntelligence, viewDate]);

  // Show loading only if both are loading, but allow activities to show even if weekData is loading
  if (weekLoading && activitiesLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Daily Schedule</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Daily Schedule</h3>
      <div className="space-y-3">
        {weekDays.map((day) => (
          <DailyWorkoutCard
            key={day.date.toString()}
            date={day.date}
            dateId={`workout-${day.dateStr}`}
            workout={day.workout}
            completed={day.completed}
            status={day.status}
            dailyDecision={day.dailyDecision}
          />
        ))}
      </div>
    </div>
  );
}
