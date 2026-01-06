import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityList } from '@/components/activities/ActivityList';
import { mockActivities } from '@/lib/mock-data';

export default function Activities() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-1">Your completed workouts with coach analysis</p>
        </div>

        <ActivityList activities={mockActivities} />
      </div>
    </AppLayout>
  );
}
