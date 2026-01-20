import { format } from 'date-fns';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlannedWorkout, CompletedActivity, DailyDecision } from '@/types';
import { CheckCircle2, XCircle, AlertCircle, Moon, RefreshCw } from 'lucide-react';
import { WorkoutSessionCard } from '@/components/workout/WorkoutSessionCard';
import { toPlannedWorkoutSession } from '@/components/workout/workoutSessionAdapter';
import type { WorkoutSession, WorkoutPhase, WorkoutMetrics, CoachTone } from '@/components/workout/types';
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
 * Converts PlannedWorkout to WorkoutSession for the new card
 */
function plannedWorkoutToSession(
  workout: PlannedWorkout,
  completed: CompletedActivity | undefined,
  cardStatus: 'upcoming' | 'today' | 'completed' | 'missed'
): WorkoutSession {
  // Determine phase based on status
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

  // Generate synthetic effort data
  const segments = Math.min(12, Math.max(6, Math.floor(workout.duration / 10)));
  const effortData = completed
    ? Array.from({ length: segments }, () => Math.floor(Math.random() * 5) + 4)
    : undefined;
  const plannedEffortData = Array.from({ length: segments }, () => Math.floor(Math.random() * 4) + 3);

  // Coach insight
  const feedbackText = completed?.coachFeedback || coachNotes[workout.intent];
  let tone: CoachTone = 'neutral';
  if (feedbackText) {
    const lower = feedbackText.toLowerCase();
    if (lower.includes('great') || lower.includes('strong') || lower.includes('good')) {
      tone = 'positive';
    } else if (lower.includes('caution') || lower.includes('monitor') || lower.includes('careful')) {
      tone = 'warning';
    }
  }

  return {
    id: workout.id,
    type: mapIntentToType(workout.intent),
    phase,
    planned: plannedMetrics,
    completed: completedMetrics,
    effortData,
    plannedEffortData,
    coachInsight: feedbackText ? { tone, message: feedbackText } : undefined,
  };
}

function mapIntentToType(intent: string): 'threshold' | 'interval' | 'recovery' | 'long' | 'easy' | 'tempo' {
  switch (intent) {
    case 'threshold': return 'threshold';
    case 'vo2': return 'interval';
    case 'recovery': return 'recovery';
    case 'endurance': return 'long';
    case 'aerobic': return 'easy';
    default: return 'easy';
  }
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

  const segments = Math.min(12, Math.max(6, Math.floor(activity.duration / 10)));
  const effortData = Array.from({ length: segments }, () => Math.floor(Math.random() * 5) + 4);

  let tone: CoachTone = 'neutral';
  if (activity.coachFeedback) {
    const lower = activity.coachFeedback.toLowerCase();
    if (lower.includes('great') || lower.includes('strong')) tone = 'positive';
    else if (lower.includes('caution') || lower.includes('monitor')) tone = 'warning';
  }

  return {
    id: activity.id,
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

  // Convert to WorkoutSession for the new card
  const workoutSession = workout
    ? plannedWorkoutToSession(workout, completed, status)
    : completed
      ? activityToSession(completed)
      : null;

  // Determine glow intensity for quality workouts
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
