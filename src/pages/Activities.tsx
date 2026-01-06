import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityList } from '@/components/activities/ActivityList';
import { fetchActivities } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function Activities() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
          <p className="text-muted-foreground mt-1">Your completed workouts with coach analysis</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Unable to load activities</p>
          </div>
        ) : (
          <ActivityList activities={activities || []} />
        )}
      </div>
    </AppLayout>
  );
}
