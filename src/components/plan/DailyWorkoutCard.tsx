import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlannedWorkout, CompletedActivity, DailyDecision } from '@/types';
import {
  Footprints, Bike, Waves, Clock, Route, Heart,
  CheckCircle2, XCircle, AlertCircle, Moon, RefreshCw
} from 'lucide-react';

interface DailyWorkoutCardProps {
  date: Date;
  workout?: PlannedWorkout;
  completed?: CompletedActivity;
  status: 'upcoming' | 'today' | 'completed' | 'missed';
  dailyDecision?: { decision: DailyDecision; reason: string } | null;
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

const decisionConfig = {
  proceed: { icon: CheckCircle2, label: 'Proceed', className: 'bg-decision-proceed/15 text-decision-proceed border-decision-proceed/30' },
  modify: { icon: AlertCircle, label: 'Modify', className: 'bg-decision-modify/15 text-decision-modify border-decision-modify/30' },
  replace: { icon: RefreshCw, label: 'Replace', className: 'bg-decision-replace/15 text-decision-replace border-decision-replace/30' },
  rest: { icon: Moon, label: 'Rest', className: 'bg-decision-rest/15 text-decision-rest border-decision-rest/30' },
};

const coachNotes: Record<string, string> = {
  aerobic: 'Keep this fully aerobic. Stay conversational throughout.',
  threshold: 'Push into the discomfort zone but stay controlled.',
  vo2: 'Hard effort today. Arrive rested and execute with intent.',
  endurance: 'Long and steady. Fuel properly and pace conservatively.',
  recovery: 'Very easy. Heart rate should stay low throughout.',
};

export function DailyWorkoutCard({ date, workout, completed, status, dailyDecision }: DailyWorkoutCardProps) {
  const isRestDay = !workout;
  const Icon = workout ? sportIcons[workout.sport] : Moon;
  const decisionInfo = dailyDecision ? decisionConfig[dailyDecision.decision] : null;
  const DecisionIcon = decisionInfo?.icon;

  return (
    <Card className={cn(
      'transition-all',
      status === 'today' && 'ring-2 ring-accent',
      status === 'missed' && 'opacity-60'
    )}>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          {/* Left: Day info */}
          <div className="lg:w-24 shrink-0">
            <div className="text-sm text-muted-foreground">{format(date, 'EEEE')}</div>
            <div className={cn(
              'text-2xl font-semibold',
              status === 'today' && 'text-accent'
            )}>
              {format(date, 'd')}
            </div>
            <div className="text-xs text-muted-foreground">{format(date, 'MMM')}</div>
            
            {/* Status badge */}
            {status === 'today' && (
              <Badge variant="outline" className="mt-2 text-xs bg-accent/10 text-accent border-accent/30">
                Today
              </Badge>
            )}
            {status === 'completed' && completed && (
              <Badge variant="outline" className="mt-2 text-xs bg-load-fresh/10 text-load-fresh border-load-fresh/30">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Done
              </Badge>
            )}
            {status === 'missed' && (
              <Badge variant="outline" className="mt-2 text-xs bg-destructive/10 text-destructive border-destructive/30">
                <XCircle className="h-3 w-3 mr-1" />
                Missed
              </Badge>
            )}
          </div>

          {/* Center: Workout details */}
          <div className="flex-1 min-w-0">
            {isRestDay ? (
              <div className="py-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Moon className="h-5 w-5" />
                  <span className="font-medium">Rest Day</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Recovery and adaptation. Stay active with light movement if desired.
                </p>
              </div>
            ) : (
              <>
                {/* Workout header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{workout.title}</h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={cn('text-xs', intentColors[workout.intent])}>
                        {workout.intent}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{workout.sport}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {workout.duration} min
                  </span>
                  {workout.distance && (
                    <span className="flex items-center gap-1">
                      <Route className="h-4 w-4" />
                      {workout.distance} km
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">{workout.description}</p>

                {/* Structure preview */}
                {workout.structure && workout.structure.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {workout.structure.slice(0, 4).map((segment, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize"
                      >
                        {segment.type}
                        {segment.duration && ` ${segment.duration}m`}
                      </span>
                    ))}
                    {workout.structure.length > 4 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        +{workout.structure.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Completed summary */}
                {completed && status === 'completed' && (
                  <div className="mt-3 p-3 bg-load-fresh/5 rounded-lg border border-load-fresh/20">
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="flex items-center gap-1 text-foreground">
                        <Clock className="h-4 w-4 text-load-fresh" />
                        {completed.duration} min
                      </span>
                      <span className="flex items-center gap-1 text-foreground">
                        <Route className="h-4 w-4 text-load-fresh" />
                        {completed.distance} km
                      </span>
                      {completed.avgHeartRate && (
                        <span className="flex items-center gap-1 text-foreground">
                          <Heart className="h-4 w-4 text-load-fresh" />
                          {completed.avgHeartRate} bpm
                        </span>
                      )}
                    </div>
                    {completed.coachFeedback && (
                      <p className="text-xs text-muted-foreground italic">
                        &ldquo;{completed.coachFeedback.slice(0, 100)}...&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right: Daily decision (for today) or coach note */}
          <div className="lg:w-64 shrink-0">
            {status === 'today' && dailyDecision && DecisionIcon && (
              <div className={cn(
                'p-3 rounded-lg border',
                decisionInfo.className
              )}>
                <div className="flex items-center gap-2 mb-2">
                  <DecisionIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{decisionInfo.label}</span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {dailyDecision.reason}
                </p>
              </div>
            )}
            
            {status !== 'today' && workout && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Coach Note
                </div>
                <p className="text-xs text-foreground leading-relaxed">
                  {coachNotes[workout.intent] || 'Execute as planned.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
