import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchActivities, fetchTrainingLoad, syncActivitiesNow } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface RecentActivitiesCardProps {
  activities10?: CompletedActivity[] | null;
  activities10Loading?: boolean;
  activities10Error?: unknown;
  trainingLoad60d?: TrainingLoadData | null;
  /** Additional CSS classes for the card container */
  className?: string;
}

// Sport type indicator - minimal dot with color encoding
function SportDot({ sport }: { sport: string }) {
  const colorMap: Record<string, string> = {
    running: 'hsl(175 60% 45%)',      // teal
    cycling: 'hsl(35 80% 55%)',        // amber
    swimming: 'hsl(210 70% 55%)',      // blue
    triathlon: 'hsl(280 50% 55%)',     // purple
    strength: 'hsl(0 60% 55%)',        // red
  };
  const color = colorMap[sport] || 'hsl(215 20% 45%)';
  
  return (
    <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
      <circle cx="4" cy="4" r="3" fill={color} opacity="0.9" />
    </svg>
  );
}

// Delta indicator for TSS comparison
function TssDelta({ current, average }: { current: number; average: number }) {
  if (average === 0) return null;
  
  const delta = ((current - average) / average) * 100;
  const isPositive = delta > 0;
  const absValue = Math.abs(delta).toFixed(0);
  
  if (Math.abs(delta) < 5) return null; // Don't show insignificant deltas
  
  return (
    <span 
      className={cn(
        "font-mono text-[9px] tracking-tight ml-1",
        isPositive ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
      )}
    >
      {isPositive ? '▲' : '▼'}{absValue}%
    </span>
  );
}

export function RecentActivitiesCard(props: RecentActivitiesCardProps = {}) {
  const { convertDistance } = useUnitSystem();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  
  const propsActivities10 = props.activities10;
  const propsActivities10Loading = props.activities10Loading;
  const propsActivities10Error = props.activities10Error;
  const propsTrainingLoad60d = props.trainingLoad60d;

  const { data: activities, isLoading: activitiesLoading, error: activitiesError, refetch } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 10],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    enabled: propsActivities10 === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncActivitiesNow();
      toast({
        title: 'Sync started',
        description: 'Activities are being synced in the background.',
      });
      
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        refetch();
      }, 3000);
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
    enabled: propsTrainingLoad60d === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const finalActivities = propsActivities10 !== undefined ? propsActivities10 : activities;
  const isLoading = propsActivities10Loading !== undefined ? propsActivities10Loading : activitiesLoading;
  const error = propsActivities10Error !== undefined ? propsActivities10Error : activitiesError;
  const finalTrainingLoadData = propsTrainingLoad60d !== undefined ? propsTrainingLoad60d : trainingLoadData;

  const { recentActivities, averageTss } = useMemo(() => {
    let activitiesArray: typeof finalActivities = [];
    if (Array.isArray(finalActivities)) {
      activitiesArray = finalActivities;
    } else if (finalActivities && typeof finalActivities === 'object' && 'activities' in finalActivities) {
      const nested = (finalActivities as { activities?: unknown }).activities;
      activitiesArray = Array.isArray(nested) ? nested : [];
    }
    
    const enriched = enrichActivitiesWithTss(activitiesArray, finalTrainingLoadData);
    
    if (!Array.isArray(enriched)) {
      return { recentActivities: [], averageTss: 0 };
    }
    
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
    
    const recent = Array.isArray(sorted) ? sorted.slice(0, 4) : [];
    const avgTss = recent.length > 0 
      ? recent.reduce((sum, a) => sum + (a.trainingLoad || 0), 0) / recent.length 
      : 0;
    
    return { recentActivities: recent, averageTss: Math.round(avgTss) };
  }, [finalActivities, finalTrainingLoadData]);

  return (
    <Card className={props.className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Recent Activities</CardTitle>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            className="h-6 px-1.5"
            disabled={isLoading || isSyncing}
            title="Sync activities"
          >
            <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
          </Button>
          <Link
            to="/activities"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : error || recentActivities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">
              {error ? 'Unable to load activities' : 'No recent activities'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table header */}
            <div className="grid grid-cols-[8px_1fr_60px_50px_50px] gap-2 py-1 border-b">
              <div />
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Session</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-right">Dist</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-right">Dur</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider text-right">TSS</span>
            </div>
            
            {(Array.isArray(recentActivities) ? recentActivities : [])
              .filter((activity) => activity && activity.date && activity.id)
              .map((activity, index) => {
                const dateStr = activity.date ? (() => {
                  try {
                    return format(parseISO(activity.date), 'dd MMM');
                  } catch {
                    return activity.date;
                  }
                })() : '—';
                
                const isLast = index === recentActivities.length - 1;
                const dist = convertDistance(activity.distance || 0);
                
                return (
                  <div
                    key={activity.id}
                    className={cn(
                      'grid grid-cols-[8px_1fr_60px_50px_50px] gap-2 py-1.5 items-center',
                      !isLast && 'border-b'
                    )}
                  >
                    {/* Sport indicator dot */}
                    <SportDot sport={activity.sport || 'running'} />
                    
                    {/* Session info */}
                    <div className="min-w-0">
                      <div className="text-sm truncate">
                        {capitalizeTitle(activity.title || 'Session')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {dateStr}
                      </div>
                    </div>
                    
                    {/* Distance */}
                    <div className="text-right text-sm text-muted-foreground">
                      {dist.value.toFixed(1)}<span className="text-xs ml-0.5">{dist.unit}</span>
                    </div>
                    
                    {/* Duration */}
                    <div className="text-right text-sm text-muted-foreground">
                      {activity.duration || 0}<span className="text-xs ml-0.5">m</span>
                    </div>
                    
                    {/* TSS with delta */}
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {activity.trainingLoad || 0}
                      </span>
                      <TssDelta current={activity.trainingLoad || 0} average={averageTss} />
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
