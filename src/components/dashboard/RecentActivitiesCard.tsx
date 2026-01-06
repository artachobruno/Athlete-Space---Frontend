import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchActivities } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Bike, Footprints, Waves, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

export function RecentActivitiesCard() {
  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities', 'recent'],
    queryFn: () => fetchActivities({ limit: 4 }),
    retry: 1,
  });

  const recentActivities = activities || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activities</CardTitle>
          <Link
            to="/activities"
            className="text-sm text-accent hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {error ? 'Unable to load activities' : 'No recent activities'}
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity) => {
            const Icon = sportIcons[activity.sport];
            return (
              <div
                key={activity.id}
                className="flex items-center gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">
                    {activity.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(parseISO(activity.date), 'MMM d')} · {activity.distance} km · {activity.duration} min
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-foreground">
                    {activity.trainingLoad}
                  </div>
                  <div className="text-xs text-muted-foreground">TSS</div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
