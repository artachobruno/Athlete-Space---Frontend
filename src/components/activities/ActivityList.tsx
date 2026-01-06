import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import {
  Footprints, Bike, Waves, Clock, Route, Heart, Zap,
  Bot, ChevronDown, ChevronUp
} from 'lucide-react';
import { ActivityExpandedContent } from './ActivityExpandedContent';

interface ActivityListProps {
  activities: CompletedActivity[];
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

export function ActivityList({ activities }: ActivityListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter out invalid/empty activities
  const validActivities = activities.filter((activity) => {
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
            <Collapsible
              key={activity.id}
              open={isExpanded}
              onOpenChange={() => toggleExpand(activity.id)}
            >
              <Card className={cn(
                'transition-all',
                isExpanded && 'ring-2 ring-accent'
              )}>
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {activity.duration || 0} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Route className="h-4 w-4" />
                      {(activity.distance || 0).toFixed(1)} km
                    </span>
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
                        {activity.elevation.toFixed(1)} m
                      </span>
                    )}
                    <span className="ml-auto font-medium text-foreground">
                      {Math.round(activity.trainingLoad || 0)} TSS
                    </span>
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
        );
      })}
    </div>
  );
}
