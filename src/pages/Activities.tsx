import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityList } from '@/components/activities/ActivityList';
import { fetchActivities, syncActivitiesNow } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { format, isToday, parseISO, isYesterday, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Activities() {
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get('activity');
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - activities don't change that frequently
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    // Only refetch when window regains focus (user comes back to tab)
    refetchOnWindowFocus: true,
    // Don't auto-refetch in background - too expensive
    refetchInterval: false,
  });

  // Check for missing recent activities
  const missingRecentActivities = useMemo(() => {
    if (!activities || activities.length === 0) return null;
    
    // Sort activities by date (most recent first)
    const sortedActivities = [...activities].sort((a, b) => {
      const dateA = a.date ? (typeof a.date === 'string' ? parseISO(a.date.split('T')[0]) : new Date(a.date)) : new Date(0);
      const dateB = b.date ? (typeof b.date === 'string' ? parseISO(b.date.split('T')[0]) : new Date(b.date)) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
    
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    
    // Check if we have today's activity
    const hasToday = sortedActivities.some(act => {
      if (!act.date) return false;
      const actDateStr = act.date.split('T')[0];
      return actDateStr === todayStr;
    });
    
    // Check if we have yesterday's activity
    const hasYesterday = sortedActivities.some(act => {
      if (!act.date) return false;
      const actDateStr = act.date.split('T')[0];
      return actDateStr === yesterdayStr;
    });
    
    const missing = [];
    if (!hasToday) {
      missing.push('today');
    }
    if (!hasYesterday && sortedActivities.length > 0) {
      // Only warn about yesterday if we have other activities (might be new user)
      const oldestActivity = sortedActivities[sortedActivities.length - 1];
      if (oldestActivity?.date) {
        const oldestDateStr = oldestActivity.date.split('T')[0];
        const oldestDate = parseISO(oldestDateStr);
        // Only warn if oldest activity is older than yesterday (user has been active before)
        if (oldestDate < subDays(today, 2)) {
          missing.push('yesterday');
        }
      }
    }
    
    return missing.length > 0 ? missing : null;
  }, [activities]);

  // Debug logging
  if (activities) {
    console.log('[Activities] Loaded activities:', activities.length);
    if (missingRecentActivities) {
      console.warn('[Activities] Missing recent activities:', missingRecentActivities);
    }
  }
  if (error) {
    console.error('[Activities] Error loading activities:', error);
  }

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncActivitiesNow();
      toast({
        title: 'Sync started',
        description: 'Activities are being synced in the background. Refreshing in a few moments...',
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Activities</h1>
            <p className="text-muted-foreground mt-1">Your completed workouts with coach analysis</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading || isSyncing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Strava'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Unable to load activities</p>
            <p className="text-xs mt-2">
              {error instanceof Error ? error.message : 'Unknown error occurred'}
            </p>
          </div>
        ) : (
          <>
            {missingRecentActivities && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-500 mt-0.5">⚠️</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Recent activities may be missing
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {missingRecentActivities.includes('today') && "Today's activity is not showing up. "}
                      {missingRecentActivities.includes('yesterday') && "Yesterday's activity is not showing up. "}
                      New activities may take a few minutes to sync from Strava.
                    </p>
                    <button
                      onClick={() => refetch()}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Refresh activities
                    </button>
                  </div>
                </div>
              </div>
            )}
            <ActivityList activities={activities || []} initialExpandedId={activityId || null} />
          </>
        )}
      </div>
    </AppLayout>
  );
}
