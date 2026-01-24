import { AppLayout } from '@/components/layout/AppLayout';
import { ActivityList } from '@/components/activities/ActivityList';
import { fetchActivities, syncActivitiesNow } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useMemo, useState, useEffect, useRef } from 'react';
import { format, isToday, parseISO, isYesterday, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useAutoMatchSessions } from '@/hooks/useAutoMatchSessions';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { PlanCoachChat } from '@/components/plan/PlanCoachChat';

export default function Activities() {
  useSyncTodayWorkout();
  const [searchParams] = useSearchParams();
  const activityId = searchParams.get('activity');
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Auto-match activities to planned sessions
  useAutoMatchSessions(true);
  
  const { data: activities, isLoading, error, refetch } = useAuthenticatedQuery({
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
    // Ensure activities is an array
    const activitiesArray = Array.isArray(activities) ? activities : [];
    if (activitiesArray.length === 0) return null;
    
    // Sort activities by date (most recent first)
    const sortedActivities = [...activitiesArray].sort((a, b) => {
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

  // Track if we've already logged missing activities to prevent loop
  const hasLoggedMissing = useRef(false);
  const lastActivitiesCount = useRef<number | null>(null);
  const lastMissingActivities = useRef<string[] | null>(null);

  // Debug logging - only log when values actually change
  useEffect(() => {
    if (activities) {
      const activitiesCount = activities.length;
      const missingStr = missingRecentActivities ? JSON.stringify(missingRecentActivities) : null;
      
      // Only log if activities count changed or missing activities changed
      if (activitiesCount !== lastActivitiesCount.current) {
        console.log('[Activities] Loaded activities:', activitiesCount);
        lastActivitiesCount.current = activitiesCount;
        hasLoggedMissing.current = false; // Reset when activities change
      }
      
      // Only log missing activities once when first detected
      if (missingRecentActivities && !hasLoggedMissing.current && missingStr !== (lastMissingActivities.current ? JSON.stringify(lastMissingActivities.current) : null)) {
        console.warn('[Activities] Missing recent activities:', missingRecentActivities);
        hasLoggedMissing.current = true;
        lastMissingActivities.current = missingRecentActivities;
      } else if (!missingRecentActivities) {
        // Reset flag when no activities are missing
        hasLoggedMissing.current = false;
        lastMissingActivities.current = null;
      }
    }
    
    if (error) {
      console.error('[Activities] Error loading activities:', error);
    }
  }, [activities, missingRecentActivities, error]);

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
      <div className="flex flex-col h-full min-h-screen bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0 mb-4">
          <div>
            <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">History</h1>
            <p className="text-muted-foreground mt-1">Your completed training</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isLoading || isSyncing}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 rounded-xl border border-border/50 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-muted-foreground rounded-xl border border-border/50 backdrop-blur-sm">
              <p>Unable to load activities</p>
              <p className="text-xs mt-2">
                {error instanceof Error ? error.message : 'Unknown error occurred'}
              </p>
            </div>
          ) : (
            <ActivityList activities={activities || []} initialExpandedId={activityId || null} />
          )}
        </div>

        {/* Floating Coach Chat */}
        <PlanCoachChat />
      </div>
    </AppLayout>
  );
}
