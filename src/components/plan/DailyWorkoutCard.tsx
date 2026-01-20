import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlannedWorkout, CompletedActivity, DailyDecision } from '@/types';
import { CheckCircle2, XCircle, AlertCircle, Moon, RefreshCw } from 'lucide-react';
import { WorkoutSessionCard } from '@/components/workout/WorkoutSessionCard';
import type { WorkoutSession, WorkoutPhase, WorkoutMetrics, CoachTone, WorkoutType } from '@/components/workout/types';
import { getGlowIntensityFromWorkout } from '@/lib/intensityGlow';

interface DailyWorkoutCardProps {
  date: Date;
  dateId?: string;
  workout?: PlannedWorkout;
  completed?: CompletedActivity;
  status: 'upcoming' | 'today' | 'completed' | 'missed';
  dailyDecision?: { decision: DailyDecision; reason: string } | null;
  onClick?: () => void;
  isExpanded?: boolean;
}

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

/**
 * Generates effort profile based on workout intent
 */
function generatePlannedEffort(intent: string, numBars: number = 10): number[] {
  const lower = (intent || '').toLowerCase();
  
  if (lower.includes('interval') || lower.includes('vo2')) {
    return Array.from({ length: numBars }, (_, i) => 
      i % 2 === 0 ? 3 + Math.random() * 2 : 7 + Math.random() * 2
    );
  }
  
  if (lower.includes('tempo') || lower.includes('threshold')) {
    return Array.from({ length: numBars }, (_, i) => {
      if (i < 2) return 3 + Math.random() * 2;
      if (i >= numBars - 2) return 3 + Math.random() * 2;
      return 6 + Math.random() * 2;
    });
  }
  
  if (lower.includes('long') || lower.includes('endurance')) {
    return Array.from({ length: numBars }, (_, i) => {
      const progress = i / numBars;
      if (progress < 0.2) return 4 + progress * 5;
      if (progress > 0.8) return 5 + (1 - progress) * 3;
      return 5 + Math.random() * 1.5;
    });
  }
  
  return Array.from({ length: numBars }, () => 3 + Math.random() * 2);
}

function mapIntentToType(intent: string): WorkoutType {
  switch (intent) {
    case 'threshold': return 'threshold';
    case 'vo2': return 'interval';
    case 'recovery': return 'recovery';
    case 'endurance': return 'long';
    case 'aerobic': return 'easy';
    default: return 'easy';
  }
}

function determineTone(text: string | undefined): CoachTone {
  if (!text) return 'neutral';
  const lower = text.toLowerCase();
  if (lower.includes('great') || lower.includes('strong') || lower.includes('good')) return 'positive';
  if (lower.includes('caution') || lower.includes('monitor') || lower.includes('careful')) return 'warning';
  return 'neutral';
}

/**
 * Converts PlannedWorkout to WorkoutSession
 */
function plannedWorkoutToSession(
  workout: PlannedWorkout,
  completed: CompletedActivity | undefined,
  cardStatus: 'upcoming' | 'today' | 'completed' | 'missed'
): WorkoutSession {
  let phase: WorkoutPhase = 'planned';
  if (cardStatus === 'completed' && completed) {
    phase = 'compliance';
  }

  const plannedMetrics: WorkoutMetrics = {
    distanceKm: workout.distance ?? 0,
    durationSec: workout.duration * 60,
    paceSecPerKm: workout.distance && workout.distance > 0
      ? (workout.duration * 60) / workout.distance
      : 0,
  };

  const completedMetrics: WorkoutMetrics | undefined = completed
    ? {
        distanceKm: completed.distance,
        durationSec: completed.duration * 60,
        paceSecPerKm: completed.distance > 0
          ? (completed.duration * 60) / completed.distance
          : 0,
      }
    : undefined;

  const plannedEffortData = generatePlannedEffort(workout.intent);
  const effortData = completed ? generatePlannedEffort(workout.intent) : undefined;

  const feedbackText = completed?.coachFeedback || coachNotes[workout.intent];
  const tone = determineTone(feedbackText);

  // Use workout title, completed activity title, or generate from intent
  const title = workout.title || completed?.title || getDefaultTitleFromIntent(workout.intent);

  return {
    id: workout.id,
    title,
    type: mapIntentToType(workout.intent),
    phase,
    planned: plannedMetrics,
    completed: completedMetrics,
    effortData,
    plannedEffortData,
    coachInsight: feedbackText ? { tone, message: feedbackText } : undefined,
  };
}

function getDefaultTitleFromIntent(intent: string): string {
  const titles: Record<string, string> = {
    threshold: 'Threshold Run',
    vo2: 'Interval Session',
    recovery: 'Recovery Run',
    endurance: 'Long Run',
    aerobic: 'Easy Run',
  };
  return titles[intent] || 'Workout';
}

/**
 * Converts CompletedActivity (without planned) to WorkoutSession
 */
function activityToSession(activity: CompletedActivity): WorkoutSession {
  const metrics: WorkoutMetrics = {
    distanceKm: activity.distance,
    durationSec: activity.duration * 60,
    paceSecPerKm: activity.distance > 0 ? (activity.duration * 60) / activity.distance : 0,
  };

  const effortData = generatePlannedEffort('easy');
  const tone = determineTone(activity.coachFeedback);

  return {
    id: activity.id,
    title: activity.title || 'Activity',
    type: 'easy',
    phase: 'completed',
    completed: metrics,
    effortData,
    coachInsight: activity.coachFeedback
      ? { tone, message: activity.coachFeedback }
      : undefined,
  };
}

export function DailyWorkoutCard({
  date,
  dateId,
  workout,
  completed,
  status,
  dailyDecision,
  onClick,
}: DailyWorkoutCardProps) {
  const isRestDay = !workout && !completed;
  const decisionInfo = dailyDecision ? decisionConfig[dailyDecision.decision] : null;
  const DecisionIcon = decisionInfo?.icon;

  const workoutSession = workout
    ? plannedWorkoutToSession(workout, completed, status)
    : completed
      ? activityToSession(completed)
      : null;

  const glowIntensity = workout 
    ? getGlowIntensityFromWorkout(workout.intent, undefined)
    : undefined;
  
  const isQualityWorkout = glowIntensity === 'threshold' || glowIntensity === 'vo2' || glowIntensity === 'hill';
  const finalGlowIntensity = isQualityWorkout ? glowIntensity : undefined;

  return (
    <GlassCard 
      id={dateId}
      glowIntensity={finalGlowIntensity}
      className={cn(
        'transition-all scroll-mt-4',
        status === 'today' && 'ring-2 ring-accent',
        status === 'missed' && 'opacity-60',
        onClick && 'cursor-pointer hover:bg-muted/50'
      )}
      onClick={onClick}
    >
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

          {/* Center: Workout Card */}
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
            ) : workoutSession ? (
              <div className="w-full max-w-[400px]">
                <WorkoutSessionCard session={workoutSession} />
              </div>
            ) : null}
          </div>

          {/* Right: Daily decision (for today) */}
          <div className="lg:w-64 shrink-0">
            {status === 'today' && dailyDecision && DecisionIcon && decisionInfo && (
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
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}
