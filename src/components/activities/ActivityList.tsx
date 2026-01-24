import { useState, useEffect, useRef, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import { capitalizeTitle } from '@/adapters/calendarAdapter';
import { Footprints, Bike, Waves, Heart, Bot, ChevronDown, ChevronUp } from 'lucide-react';
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
              return format(parseISO(activity.date), 'EEE, MMM d');
            } catch {
              return activity.date;
            }
          })() : 'Unknown';

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
                    'transition-all bg-transparent border-primary/20 shadow-none',
                    isExpanded && 'ring-2 ring-primary/50'
                  )}
                >
                <CollapsibleTrigger asChild>
                  <CardContent className="p-4 cursor-pointer bg-primary/[0.02] hover:bg-primary/5 transition-colors">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5 text-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {capitalizeTitle(activity.title || 'Untitled Activity')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {dateStr}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
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

                    {/* Metrics row */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">{activity.duration || 0}</span>
                        <span className="text-muted-foreground">min</span>
                      </span>
                      <div className="w-px h-4 bg-border" />
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {convertDistance(activity.distance || 0).value.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">
                          {convertDistance(activity.distance || 0).unit}
                        </span>
                      </span>
                      {activity.trainingLoad > 0 && (
                        <>
                          <div className="w-px h-4 bg-border" />
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground">{Math.round(activity.trainingLoad)}</span>
                            <span className="text-muted-foreground">TSS</span>
                          </span>
                        </>
                      )}
                      {activity.avgHeartRate && (
                        <>
                          <div className="w-px h-4 bg-border" />
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Heart className="h-4 w-4" />
                            <span>{Math.round(activity.avgHeartRate)} bpm</span>
                          </span>
                        </>
                      )}
                      {activity.intensityFactor !== undefined && activity.intensityFactor !== null && (
                        <>
                          <div className="w-px h-4 bg-border" />
                          <span className={cn(
                            "text-sm",
                            activity.intensityFactor >= 1.0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                          )}>
                            IF {activity.intensityFactor.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Coach Insight Preview */}
                    {activity.coachFeedback && !isExpanded && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg border-l-2 border-primary/30">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-primary">Analysis</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
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
