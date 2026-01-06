import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityList } from '@/components/activities/ActivityList';
import { ActivityDetail } from '@/components/activities/ActivityDetail';
import { mockActivities } from '@/lib/mock-data';
import type { CompletedActivity } from '@/types';

export default function Activities() {
  const [selectedActivity, setSelectedActivity] = useState<CompletedActivity | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-1">Your completed workouts with coach analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity List */}
          <div className={selectedActivity ? 'lg:col-span-1' : 'lg:col-span-3'}>
            <ActivityList
              activities={mockActivities}
              selectedId={selectedActivity?.id}
              onSelect={setSelectedActivity}
            />
          </div>

          {/* Activity Detail */}
          {selectedActivity && (
            <div className="lg:col-span-2">
              <ActivityDetail
                activity={selectedActivity}
                onClose={() => setSelectedActivity(null)}
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
