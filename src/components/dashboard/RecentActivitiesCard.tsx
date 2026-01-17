import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchActivities, fetchTrainingLoad, syncActivitiesNow } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Bike, Footprints, Waves, Loader2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useMemo, useState } from 'react';
import { enrichActivitiesWithTss, type TrainingLoadData } from '@/lib/tss-utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { CompletedActivity } from '@/types';
import { capitalizeTitle } from '@/adapters/calendarAdapter';

interface RecentActivitiesCardProps {
  activities10?: CompletedActivity[] | null;
  activities10Loading?: boolean;
  activities10Error?: unknown;
  trainingLoad60d?: TrainingLoadData | null;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

export function RecentActivitiesCard(props?: RecentActivitiesCardProps) {
  const { convertDistance } = useUnitSystem();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Use props if provided, otherwise fetch (backward compatibility)
  const propsActivities10 = props?.activities10;
  const propsActivities10Loading = props?.activities10Loading;
  const propsActivities10Error = props?.activities10Error;
  const propsTrainingLoad60d = props?.trainingLoad60d;

  // Use same query key structure as main activities page to share cache
  const { data: activities, isLoading: activitiesLoading, error: activitiesError, refetch } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 10],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    enabled: propsActivities10 === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncActivitiesNow();
      toast({
        title: 'Sync started',
        description: 'Activities are being synced in the background. This may take a few moments.',
      });
      
      // Invalidate activities queries to trigger refetch after sync
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        refetch();
      }, 3000); // Wait 3 seconds for sync to start processing
    } catch (error) {
      console.error('Failed to sync activities:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Could not sync activities',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const { data: trainingLoadData } = useAuthenticatedQuery<TrainingLoadData>({
    queryKey: ['trainingLoad', 60],
    queryFn: () => {
      console.log('[RecentActivitiesCard] Fetching training load for 60 days');
      return fetchTrainingLoad(60);
    },
    retry: (failureCount, error) => {
      if (error && typeof error === 'object') {
        const apiError = error as { code?: string; message?: string; status?: number };
        if (apiError.status === 500 || apiError.status === 503 ||
            apiError.code === 'ECONNABORTED' || 
            (apiError.message && apiError.message.includes('timed out'))) {
          return false;
        }
      }
      return failureCount < 1;
    },
    enabled: propsTrainingLoad60d === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Use props if provided, otherwise use fetched data
  const finalActivities = propsActivities10 !== undefined ? propsActivities10 : activities;
  const isLoading = propsActivities10Loading !== undefined ? propsActivities10Loading : activitiesLoading;
  const error = propsActivities10Error !== undefined ? propsActivities10Error : activitiesError;
  const finalTrainingLoadData = propsTrainingLoad60d !== undefined ? propsTrainingLoad60d : trainingLoadData;

  const recentActivities = useMemo(() => {
    // Defensive: ensure activities is always an array
    let activitiesArray: typeof finalActivities = [];
    if (Array.isArray(finalActivities)) {
      activitiesArray = finalActivities;
    } else if (finalActivities && typeof finalActivities === 'object' && 'activities' in finalActivities) {
      // Handle case where API returns { activities: [...] }
      const nested = (finalActivities as { activities?: unknown }).activities;
      activitiesArray = Array.isArray(nested) ? nested : [];
    }
    
    const enriched = enrichActivitiesWithTss(activitiesArray, finalTrainingLoadData);
    
    // Ensure enriched is an array before sorting
    if (!Array.isArray(enriched)) {
      return [];
    }
    
    // Sort by date (most recent first) and take only the 4 most recent
    const sorted = enriched.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      try {
        const dateA = typeof a.date === 'string' ? parseISO(a.date.split('T')[0]) : new Date(a.date);
        const dateB = typeof b.date === 'string' ? parseISO(b.date.split('T')[0]) : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
    
    // Ensure we return an array
    return Array.isArray(sorted) ? sorted.slice(0, 4) : []; // Return only 4 most recent
  }, [finalActivities, finalTrainingLoadData]);

  return (
    <GlassCard>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activities</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              className="h-7 px-2 text-xs"
              disabled={isLoading || isSyncing}
              title="Sync activities from Strava"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Link
              to="/activities"
              className="text-sm text-accent hover:underline"
            >
              View all
            </Link>
          </div>
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
            {(Array.isArray(recentActivities) ? recentActivities : [])
              .filter((activity) => activity && activity.date && activity.id)
              .map((activity) => {
                const Icon = sportIcons[activity.sport] || Footprints;
                const dateStr = activity.date ? (() => {
                  try {
                    return format(parseISO(activity.date), 'MMM d');
                  } catch {
                    return activity.date;
                  }
                })() : 'Unknown date';
                
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
                        {capitalizeTitle(activity.title || 'Untitled Activity')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dateStr} · {(() => {
                          const dist = convertDistance(activity.distance || 0);
                          return `${dist.value.toFixed(1)} ${dist.unit}`;
                        })()} · {activity.duration || 0} min
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {activity.trainingLoad || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">TSS</div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}
