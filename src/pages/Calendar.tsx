// Schedule page rules:
// - No coaching logic
// - No analytics
// - No vertical scrolling
// - Week view is default
// - This page answers: "When am I training?"

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
      <div className="h-[calc(100vh-3rem-3.5rem)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Schedule</h1>
          <p className="text-muted-foreground mt-1">Your training time structure</p>
        </div>

        {/* Calendar - Must fit in viewport without vertical scrolling */}
        <div className="flex-1 min-h-0">
          <TrainingCalendar />
        </div>
      </div>
    </AppLayout>
  );
}
