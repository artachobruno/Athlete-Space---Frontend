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
        {/* Header */}
        <div>
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Schedule</h1>
          <p className="text-muted-foreground mt-1">Your training time structure</p>
        </div>

        {/* Calendar */}
        <TrainingCalendar />
      </div>
    </AppLayout>
  );
}
