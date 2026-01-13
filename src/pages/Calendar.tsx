import { AppLayout } from '@/components/layout/AppLayout';
import { TrainingCalendar } from '@/components/calendar/TrainingCalendar';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { useAutoMatchSessions } from '@/hooks/useAutoMatchSessions';

export default function Calendar() {
  useSyncTodayWorkout();
  
  // Auto-match activities to planned sessions
  useAutoMatchSessions(true);

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
