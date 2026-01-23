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
import { PAGE_BG, scheduleThemeVars } from '@/styles/scheduleTheme';

export default function Calendar() {
  useSyncTodayWorkout();
  
  // Auto-match activities to planned sessions
  useAutoMatchSessions(true);

  return (
    <AppLayout>
      <div
        className="flex flex-col h-full min-h-screen"
        style={{
          ...scheduleThemeVars,
          background: PAGE_BG,
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 mb-4">
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Schedule</h1>
          <p className="text-muted-foreground mt-1">Your training time structure</p>
        </div>

        {/* Calendar - flexible container */}
        <div className="flex-1 min-h-0">
          <TrainingCalendar />
        </div>
      </div>
    </AppLayout>
  );
}
