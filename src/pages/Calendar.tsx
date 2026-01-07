import { AppLayout } from '@/components/layout/AppLayout';
import { TrainingCalendar } from '@/components/calendar/TrainingCalendar';

export default function Calendar() {
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
