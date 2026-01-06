import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Footprints, Bike, Waves, Clock, Route, Mountain, Heart, Zap, MessageCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery } from '@tanstack/react-query';
import { fetchTrainingLoad } from '@/lib/api';
import { useMemo } from 'react';
import { getTssForDate, enrichActivitiesWithTss } from '@/lib/tss-utils';

interface ActivityPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plannedWorkout?: PlannedWorkout | null;
  completedActivity?: CompletedActivity | null;
  onAskCoach?: (context: string) => void;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

const intentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
};

const structureTypeColors = {
  warmup: 'bg-training-recovery/20 text-training-recovery',
  main: 'bg-training-aerobic/20 text-training-aerobic',
  cooldown: 'bg-training-recovery/20 text-training-recovery',
  interval: 'bg-training-vo2/20 text-training-vo2',
  recovery: 'bg-muted text-muted-foreground',
};

export function ActivityPopup({ 
  open, 
  onOpenChange, 
  plannedWorkout, 
  completedActivity,
  onAskCoach 
}: ActivityPopupProps) {
  const navigate = useNavigate();
  const { convertDistance, convertElevation } = useUnitSystem();
  const workout = plannedWorkout;
  const activity = completedActivity;
  const SportIcon = sportIcons[workout?.sport || activity?.sport || 'running'];
  
  // Fetch training load to get TSS if activity doesn't have it
  const { data: trainingLoadData } = useQuery({
    queryKey: ['trainingLoad', 60],
    queryFn: () => fetchTrainingLoad(60),
    retry: 1,
  });
  
  // Enrich activity with TSS from training load if needed
  const enrichedActivity = useMemo(() => {
    if (!activity) return null;
    const enriched = enrichActivitiesWithTss([activity], trainingLoadData);
    return enriched[0] || activity;
  }, [activity, trainingLoadData]);
  
  // Get TSS for display
  const displayTss = enrichedActivity?.trainingLoad || 
    (activity?.date ? getTssForDate(activity.date, trainingLoadData) : null);

  const handleViewDetails = () => {
    onOpenChange(false);
    if (activity?.id) {
      navigate(`/activities?activity=${activity.id}`);
    } else {
      navigate('/activities');
    }
  };

  if (!workout && !activity) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <SportIcon className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-foreground">
                {workout?.title || activity?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {workout && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', intentColors[workout.intent])}
                  >
                    {workout.intent}
                  </Badge>
                )}
                {activity && (
                  <Badge variant="outline" className="text-xs bg-accent/15 text-accent border-accent/30">
                    Completed
                  </Badge>
                )}
                {workout?.completed && (
                  <CheckCircle2 className="h-4 w-4 text-load-fresh" />
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Metrics row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {workout?.duration || activity?.duration}m
            </span>
            {(workout?.distance || activity?.distance) && (
              <span className="flex items-center gap-1.5">
                <Route className="h-4 w-4" />
                {(() => {
                  const dist = convertDistance((workout?.distance || activity?.distance) || 0);
                  return `${dist.value.toFixed(1)} ${dist.unit}`;
                })()}
              </span>
            )}
            {activity?.elevation && (
              <span className="flex items-center gap-1.5">
                <Mountain className="h-4 w-4" />
                {(() => {
                  const elev = convertElevation(activity.elevation);
                  return `${elev.value.toFixed(1)} ${elev.unit}`;
                })()}
              </span>
            )}
          </div>

          {/* Activity-specific metrics */}
          {activity && (
            <div className="grid grid-cols-2 gap-3">
              {activity.avgPace && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">Avg Pace</div>
                  <div className="text-sm font-medium text-foreground">{activity.avgPace}</div>
                </div>
              )}
              {activity.avgHeartRate && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Heart className="h-3 w-3" /> Avg HR
                  </div>
                  <div className="text-sm font-medium text-foreground">{Math.round(activity.avgHeartRate)} bpm</div>
                </div>
              )}
              {activity.avgPower && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Avg Power
                  </div>
                  <div className="text-sm font-medium text-foreground">{Math.round(activity.avgPower)}w</div>
                </div>
              )}
              {displayTss !== null && displayTss > 0 && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground mb-1">TSS</div>
                  <div className="text-sm font-medium text-foreground">{Math.round(displayTss)}</div>
                </div>
              )}
            </div>
          )}

          {/* Workout description */}
          {workout?.description && (
            <div className="text-sm text-muted-foreground">
              {workout.description}
            </div>
          )}

          {/* Workout structure */}
          {workout?.structure && workout.structure.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Structure
              </h4>
              <div className="space-y-1.5">
                {workout.structure.map((segment, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md text-sm',
                      structureTypeColors[segment.type]
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{segment.type}</span>
                      {segment.notes && (
                        <span className="text-xs opacity-75">({segment.notes})</span>
                      )}
                    </div>
                    <div className="text-xs">
                      {segment.duration && `${segment.duration}m`}
                      {segment.intensity && ` • ${segment.intensity}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coach feedback for completed activities */}
          {activity?.coachFeedback && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">Coach Feedback</span>
              </div>
              <p className="text-sm text-foreground">{activity.coachFeedback}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                onAskCoach?.(workout?.title || activity?.title || '');
                onOpenChange(false);
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Ask Coach
            </Button>
            {activity && (
              <Button
                variant="default"
                className="flex-1"
                onClick={handleViewDetails}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
