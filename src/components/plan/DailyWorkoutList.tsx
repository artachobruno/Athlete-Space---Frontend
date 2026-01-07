import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday, isBefore } from 'date-fns';
import { fetchCalendarWeek, fetchActivities, fetchTrainingLoad } from '@/lib/api';
import { mapSessionToWorkout } from '@/lib/session-utils';
import { getTodayIntelligence } from '@/lib/intelligence';
import { DailyWorkoutCard } from './DailyWorkoutCard';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import { enrichActivitiesWithTss } from '@/lib/tss-utils';

import { mapSessionToWorkout } from '@/lib/session-utils';

export function DailyWorkoutList() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  // Use consistent query key to share cache with other components
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: trainingLoadData } = useQuery({
    queryKey: ['trainingLoad', 14],
    queryFn: () => fetchTrainingLoad(14),
    retry: (failureCount, error) => {
      // Don't retry on timeout errors
      if (error && typeof error === 'object' && 'code' in error) {
        const apiError = error as { code?: string; message?: string };
        if (apiError.code === 'ECONNABORTED' || 
            (apiError.message && apiError.message.includes('timed out'))) {
          return false;
        }
      }
      return failureCount < 1;
    },
  });

  const { data: todayIntelligence } = useQuery({
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
    if (!weekData || !enrichedActivities) return [];

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const session = weekData.sessions?.find(s => s.date === dateStr && s.status === 'planned');
      const workout = session ? mapSessionToWorkout(session) : null;
      
      const completed = enrichedActivities.find((a: CompletedActivity) => a.date === dateStr);
      
      // Determine status
      let status: 'upcoming' | 'today' | 'completed' | 'missed' = 'upcoming';
      if (isToday(date)) {
        status = 'today';
      } else if (isBefore(date, today) && !isToday(date)) {
        status = completed ? 'completed' : (workout ? 'missed' : 'upcoming');
      }

      // Get daily decision for today
      const dailyDecision = isToday(date) && todayIntelligence ? {
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
  }, [weekData, enrichedActivities, weekStart, today, todayIntelligence]);

  if (weekLoading || activitiesLoading) {
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
