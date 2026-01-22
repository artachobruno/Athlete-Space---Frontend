import { AppLayout } from '@/components/layout/AppLayout';
import { CoachChat } from '@/components/coach/CoachChat';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';

export default function Coach() {
  useSyncTodayWorkout();
  return (
    <AppLayout>
      <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-4rem)] flex flex-col">
        <div className="mb-4">
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Coach</h1>
          <p className="text-muted-foreground mt-1">Ask questions, discuss training, request adjustments</p>
        </div>
        <CoachChat />
      </div>
    </AppLayout>
  );
}
