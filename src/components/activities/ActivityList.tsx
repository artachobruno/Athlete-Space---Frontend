import { useState, useEffect, useRef, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
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
    <div className="space-y-3">
      {validActivities.map((activity) => {
          const Icon = sportIcons[activity.sport] || Footprints;
          const isExpanded = expandedId === activity.id;
          
          const dateStr = activity.date ? (() => {
            try {
              return format(parseISO(activity.date), 'EEEE, MMM d');
            } catch {
              return activity.date;
            }
          })() : 'Unknown date';

          return (
            <div
              key={activity.id}
              ref={isExpanded && initialExpandedId === activity.id ? expandedRef : null}
            >
              <Collapsible
                open={isExpanded}
                onOpenChange={() => toggleExpand(activity.id)}
              >
                <Card 
                  className={cn(
                    'transition-all',
                    isExpanded && 'ring-2 ring-accent'
                  )}
                >
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{activity.title || 'Untitled Activity'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {dateStr}
                        </p>
                      </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="shrink-0 capitalize">
                        {activity.sport}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {activity.duration || 0} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Route className="h-4 w-4" />
                      {(() => {
                        const dist = convertDistance(activity.distance || 0);
                        return `${dist.value.toFixed(1)} ${dist.unit}`;
                      })()}
                    </span>
                    {activity.trainingLoad > 0 && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {Math.round(activity.trainingLoad)} TSS
                      </span>
                    )}
                    {/* Normalized Power / Effort - only for bike and run */}
                    {activity.normalizedPower !== undefined && activity.normalizedPower !== null && 
                     (activity.sport === 'cycling' || activity.sport === 'running') && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                              <Zap className="h-4 w-4" />
                              {activity.sport === 'cycling' 
                                ? `${Math.round(activity.normalizedPower)} NP`
                                : `${activity.normalizedPower.toFixed(2)} NE`}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="whitespace-pre-line text-sm">
                              {activity.sport === 'cycling' 
                                ? 'Normalized Power (NP)\nAccounts for variability in effort.\nMore accurate than average power.'
                                : 'Normalized Effort\nAdjusts for pace variability to reflect true effort.'}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {/* Intensity Factor */}
                    {activity.intensityFactor !== undefined && activity.intensityFactor !== null ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "flex items-center gap-1 cursor-help",
                              activity.effortSource === 'hr' && "opacity-60",
                              activity.intensityFactor >= 1.0 && "text-load-overreaching font-medium"
                            )}>
                              <TrendingUp className="h-4 w-4" />
                              IF {activity.intensityFactor.toFixed(2)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <div className="whitespace-pre-line text-sm">
                              Intensity Factor (IF)
                              {'\n'}Compares session effort to your threshold.
                              {'\n'}IF = 1.00 ≈ threshold effort
                              {'\n'}IF &lt; 0.75 = easy
                              {'\n'}IF &gt; 1.05 = hard
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : activity.sport === 'cycling' || activity.sport === 'running' ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help opacity-60">
                              <TrendingUp className="h-4 w-4" />
                              IF —
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <div className="text-sm">Set your threshold to enable IF</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                    {activity.avgHeartRate && (
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {Math.round(activity.avgHeartRate)} bpm
                      </span>
                    )}
                    {activity.avgPower && (
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {Math.round(activity.avgPower)} W
                      </span>
                    )}
                    {activity.elevation && (
                      <span className="flex items-center gap-1">
                        <Route className="h-4 w-4" />
                        {(() => {
                          const elev = convertElevation(activity.elevation);
                          return `${elev.value.toFixed(1)} ${elev.unit}`;
                        })()}
                      </span>
                    )}
                    {/* Effort Source Label */}
                    {activity.effortSource && (
                      <span className="text-xs text-muted-foreground/70 ml-auto">
                        Source: {activity.effortSource === 'power' ? 'Power' : 
                                activity.effortSource === 'pace' ? 'Pace' : 
                                'HR'}
                      </span>
                    )}
                  </div>

                  {/* Coach Insight Preview */}
                  {activity.coachFeedback && !isExpanded && (
                    <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="h-4 w-4 text-accent" />
                        <span className="text-xs font-medium text-accent">Coach Insight</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                        {activity.coachFeedback}
                      </p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <ActivityExpandedContent activity={activity} />
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
        );
      })}
    </div>
  );
}
