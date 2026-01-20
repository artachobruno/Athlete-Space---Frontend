import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
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
        isPositive ? "text-[hsl(175_60%_45%)]" : "text-[hsl(215_20%_50%)]"
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
    <F1Card className={props.className}>
      <F1CardHeader
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSync}
              className="h-6 px-1.5 text-[hsl(var(--f1-text-muted))] hover:text-[hsl(var(--f1-text-primary))] hover:bg-transparent"
              disabled={isLoading || isSyncing}
              title="Sync activities"
            >
              <RefreshCw className={cn('h-3 w-3', isSyncing && 'animate-spin')} />
            </Button>
            <Link
              to="/activities"
              className="f1-label tracking-widest text-[hsl(var(--f1-text-muted))] hover:text-[hsl(var(--accent-telemetry))] transition-colors"
            >
              ALL →
            </Link>
          </div>
        }
      >
        <F1CardTitle>ACTIVITY LOG</F1CardTitle>
      </F1CardHeader>
      
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-[hsl(var(--f1-text-muted))]" />
          </div>
        ) : error || recentActivities.length === 0 ? (
          <div className="text-center py-6">
            <p className="f1-label tracking-widest text-[hsl(var(--f1-text-muted))]">
              {error ? 'SIGNAL UNAVAILABLE' : 'NO SESSIONS'}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {/* Table header */}
            <div className="grid grid-cols-[8px_1fr_60px_50px_50px] gap-2 py-1 border-b border-[hsl(215_15%_18%)]">
              <div />
              <F1CardLabel className="tracking-widest text-[8px]">SESSION</F1CardLabel>
              <F1CardLabel className="tracking-widest text-[8px] text-right">DIST</F1CardLabel>
              <F1CardLabel className="tracking-widest text-[8px] text-right">DUR</F1CardLabel>
              <F1CardLabel className="tracking-widest text-[8px] text-right">TSS</F1CardLabel>
            </div>
            
            {(Array.isArray(recentActivities) ? recentActivities : [])
              .filter((activity) => activity && activity.date && activity.id)
              .map((activity, index) => {
                const dateStr = activity.date ? (() => {
                  try {
                    return format(parseISO(activity.date), 'dd MMM').toUpperCase();
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
                      !isLast && 'border-b border-[hsl(215_15%_14%)]'
                    )}
                  >
                    {/* Sport indicator dot */}
                    <SportDot sport={activity.sport || 'running'} />
                    
                    {/* Session info */}
                    <div className="min-w-0">
                      <div className="font-mono text-[11px] text-[hsl(var(--f1-text-primary))] truncate tracking-tight">
                        {capitalizeTitle(activity.title || 'Session')}
                      </div>
                      <div className="font-mono text-[9px] text-[hsl(var(--f1-text-muted))] tracking-wider">
                        {dateStr}
                      </div>
                    </div>
                    
                    {/* Distance */}
                    <div className="text-right font-mono text-[11px] text-[hsl(var(--f1-text-secondary))] tracking-tight">
                      {dist.value.toFixed(1)}<span className="text-[hsl(var(--f1-text-muted))] text-[9px] ml-0.5">{dist.unit}</span>
                    </div>
                    
                    {/* Duration */}
                    <div className="text-right font-mono text-[11px] text-[hsl(var(--f1-text-secondary))] tracking-tight">
                      {activity.duration || 0}<span className="text-[hsl(var(--f1-text-muted))] text-[9px] ml-0.5">m</span>
                    </div>
                    
                    {/* TSS with delta */}
                    <div className="text-right">
                      <span className="font-mono text-[11px] text-[hsl(var(--f1-text-primary))] tracking-tight font-medium">
                        {activity.trainingLoad || 0}
                      </span>
                      <TssDelta current={activity.trainingLoad || 0} average={averageTss} />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </F1Card>
  );
}
