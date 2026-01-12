import { AppLayout } from '@/components/layout/AppLayout';
import { TrainingCalendar } from '@/components/calendar/TrainingCalendar';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { fetchActivities } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useAutoMatchSessions } from '@/hooks/useAutoMatchSessions';

export default function Calendar() {
  useSyncTodayWorkout();
  
  // Auto-match activities to planned sessions
  useAutoMatchSessions(true);
  
  // Load activities individually to input in the calendar the same way we do in Activities page
  const { data: activities, isLoading, error } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - activities don't change that frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    // Only refetch when window regains focus (user comes back to tab)
    refetchOnWindowFocus: true,
    // Don't auto-refetch in background - too expensive
    refetchInterval: false,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Calendar</h1>
          <p className="text-muted-foreground mt-1">Your training schedule</p>
        </div>
        <TrainingCalendar />
      </div>
    </AppLayout>
  );
}
