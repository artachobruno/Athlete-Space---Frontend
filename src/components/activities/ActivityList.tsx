import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import { Footprints, Bike, Waves, Clock, Route, Heart, Zap, Bot } from 'lucide-react';

interface ActivityListProps {
  activities: CompletedActivity[];
  selectedId?: string;
  onSelect: (activity: CompletedActivity) => void;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

export function ActivityList({ activities, selectedId, onSelect }: ActivityListProps) {
  return (
    <div className="space-y-3">
      {activities.map((activity) => {
        const Icon = sportIcons[activity.sport];
        const isSelected = selectedId === activity.id;

        return (
          <Card
            key={activity.id}
            className={cn(
              'cursor-pointer transition-all hover:border-accent/50',
              isSelected && 'ring-2 ring-accent border-accent'
            )}
            onClick={() => onSelect(activity)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(activity.date), 'EEEE, MMM d')}
                  </p>
                </div>
                <Badge variant="outline" className="shrink-0 capitalize">
                  {activity.sport}
                </Badge>
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {activity.duration} min
                </span>
                <span className="flex items-center gap-1">
                  <Route className="h-4 w-4" />
                  {activity.distance} km
                </span>
                {activity.avgHeartRate && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {activity.avgHeartRate} bpm
                  </span>
                )}
                {activity.avgPower && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    {activity.avgPower} W
                  </span>
                )}
              </div>

              {/* TSS */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Training Load</span>
                <span className="font-semibold text-foreground">{activity.trainingLoad} TSS</span>
              </div>

              {/* Coach Insight Preview */}
              {activity.coachFeedback && (
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
          </Card>
        );
      })}
    </div>
  );
}
