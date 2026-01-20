import { useState, useEffect, useRef, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import { capitalizeTitle } from '@/adapters/calendarAdapter';
import {
  Footprints, Bike, Waves, Clock, Route, Heart, Zap,
  Bot, ChevronDown, ChevronUp, Info, TrendingUp
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ActivityExpandedContent } from './ActivityExpandedContent';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { fetchTrainingLoad } from '@/lib/api';
import { enrichActivitiesWithTss } from '@/lib/tss-utils';
import { useQuery } from '@tanstack/react-query';

interface ActivityListProps {
  activities: CompletedActivity[];
  initialExpandedId?: string | null;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

export function ActivityList({ activities, initialExpandedId = null }: ActivityListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(initialExpandedId);
  const expandedRef = useRef<HTMLDivElement>(null);
  const { convertDistance, convertElevation } = useUnitSystem();
  
  // Fetch training load data to enrich activities with TSS
  const { data: trainingLoadData } = useQuery({
    queryKey: ['trainingLoad', 60],
    queryFn: () => {
      console.log('[ActivityList] Fetching training load for 60 days');
      return fetchTrainingLoad(60);
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors or 500 errors (fetchTrainingLoad returns empty response for 500s)
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
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });
  
  // Enrich activities with TSS from training load endpoint
  const enrichedActivities = useMemo(() => {
    // Defensive: ensure activities is always an array
    let activitiesArray: typeof activities = [];
    if (Array.isArray(activities)) {
      activitiesArray = activities;
    } else if (activities && typeof activities === 'object' && 'activities' in activities) {
      // Handle case where API returns { activities: [...] }
      const nested = (activities as { activities?: unknown }).activities;
      activitiesArray = Array.isArray(nested) ? nested : [];
    }
    
    const enriched = enrichActivitiesWithTss(activitiesArray, trainingLoadData);
    // Ensure we always return an array
    return Array.isArray(enriched) ? enriched : [];
  }, [activities, trainingLoadData]);
  
  // Expand the activity if initialExpandedId is provided
  useEffect(() => {
    if (initialExpandedId && Array.isArray(activities) && activities.length > 0) {
      setExpandedId(initialExpandedId);
      // Scroll to the expanded activity after a delay to ensure it's rendered
      setTimeout(() => {
        if (expandedRef.current) {
          expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [initialExpandedId, activities]);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter out invalid/empty activities
  const validActivities = (Array.isArray(enrichedActivities) ? enrichedActivities : []).filter((activity) => {
    if (!activity || !activity.id) {
      return false;
    }
    
    // Must have required fields
    if (!activity.date || !activity.sport) {
      return false;
    }
    
    // Filter out placeholder/mock activities
    const title = (activity.title || '').toLowerCase();
    if (title.includes('placeholder') || title.includes('mock') || title.includes('sample') || title === 'untitled activity') {
      return false;
    }
    
    return true;
  });

  if (validActivities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No activities found</p>
        <p className="text-xs mt-2">Connect your Strava account to sync activities</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {validActivities.map((activity) => {
          const Icon = sportIcons[activity.sport] || Footprints;
          const isExpanded = expandedId === activity.id;
          
          const dateStr = activity.date ? (() => {
            try {
              return format(parseISO(activity.date), 'EEE, MMM d').toUpperCase();
            } catch {
              return activity.date;
            }
          })() : 'UNKNOWN';

          return (
            <div
              key={activity.id}
              ref={isExpanded && initialExpandedId === activity.id ? expandedRef : null}
            >
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleExpand(activity.id)}
              >
                <GlassCard 
                  className={cn(
                    'transition-all border-border/50',
                    isExpanded && 'ring-1 ring-accent/40'
                  )}
                >
                <CollapsibleTrigger asChild>
                  <CardContent className="p-3 cursor-pointer hover:bg-muted/20 transition-colors">
                    {/* Header - Compact telemetry style */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-muted/50 rounded">
                        <Icon className="h-4 w-4 text-foreground/70" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground truncate tracking-tight">
                          {capitalizeTitle(activity.title || 'Untitled Activity')}
                        </h3>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                          {dateStr}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0">
                        {activity.sport}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {isExpanded ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    {/* Metrics - Telemetry row style */}
                    <div className="flex items-center gap-3 text-xs tabular-nums flex-wrap">
                      <span className="flex items-center gap-1 text-foreground">
                        <span className="font-semibold">{activity.duration || 0}</span>
                        <span className="text-[9px] text-muted-foreground/50 uppercase">min</span>
                      </span>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="flex items-center gap-1 text-foreground">
                        <span className="font-semibold">
                          {convertDistance(activity.distance || 0).value.toFixed(1)}
                        </span>
                        <span className="text-[9px] text-muted-foreground/50 uppercase">
                          {convertDistance(activity.distance || 0).unit}
                        </span>
                      </span>
                      {activity.trainingLoad > 0 && (
                        <>
                          <span className="text-muted-foreground/30">|</span>
                          <span className="flex items-center gap-1 text-foreground">
                            <span className="font-semibold">{Math.round(activity.trainingLoad)}</span>
                            <span className="text-[9px] text-muted-foreground/50 uppercase">TSS</span>
                          </span>
                        </>
                      )}
                      {activity.avgHeartRate && (
                        <>
                          <span className="text-muted-foreground/30">|</span>
                          <span className="flex items-center gap-1 text-muted-foreground/70">
                            <Heart className="h-3 w-3" />
                            <span>{Math.round(activity.avgHeartRate)}</span>
                          </span>
                        </>
                      )}
                      {activity.intensityFactor !== undefined && activity.intensityFactor !== null && (
                        <>
                          <span className="text-muted-foreground/30">|</span>
                          <span className={cn(
                            "text-[10px] font-mono",
                            activity.intensityFactor >= 1.0 ? "text-load-overreaching" : "text-muted-foreground/60"
                          )}>
                            IF {activity.intensityFactor.toFixed(2)}
                          </span>
                        </>
                      )}
                      {activity.effortSource && (
                        <span className="text-[9px] text-muted-foreground/40 ml-auto uppercase tracking-wider">
                          {activity.effortSource}
                        </span>
                      )}
                    </div>

                    {/* Coach Insight Preview - Condensed */}
                    {activity.coachFeedback && !isExpanded && (
                      <div className="px-2 py-1.5 bg-card/50 border-l-2 border-accent/30 mt-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <Bot className="h-2.5 w-2.5 text-accent/60" />
                          <span className="text-[9px] font-medium uppercase tracking-wider text-accent/60">Analysis</span>
                        </div>
                        <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-1">
                          {activity.coachFeedback}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleTrigger>

              <CollapsibleContent>
                <ActivityExpandedContent activity={activity} />
              </CollapsibleContent>
            </GlassCard>
          </Collapsible>
        </div>
        );
      })}
    </div>
  );
}
