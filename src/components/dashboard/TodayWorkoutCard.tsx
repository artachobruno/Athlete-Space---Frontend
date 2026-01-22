import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { fetchCalendarToday, fetchTrainingLoad, fetchActivities, fetchActivityStreams } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { format } from 'date-fns';
import { Loader2, Moon, Brain, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useMemo, useState } from 'react';
import { getTssForDate, enrichActivitiesWithTss, type TrainingLoadData } from '@/lib/tss-utils';
import { SessionCard } from '@/components/sessions/SessionCard';
import { Link, useNavigate } from 'react-router-dom';
import type { CompletedActivity } from '@/types';
import type { TodayResponse } from '@/lib/api';
import { WorkoutDetailCard } from '@/components/workouts/WorkoutDetailCard';

// Map workout intent to status for badge display
type WorkoutIntent = 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery';

function mapTypeToIntent(type: string | null | undefined): WorkoutIntent {
  if (!type || typeof type !== 'string') {
    return 'aerobic';
  }
  const lower = type.toLowerCase();
  if (lower.includes('threshold') || lower.includes('tempo')) return 'threshold';
  if (lower.includes('vo2') || lower.includes('interval')) return 'vo2';
  if (lower.includes('endurance') || lower.includes('long')) return 'endurance';
  if (lower.includes('recovery') || lower.includes('easy')) return 'recovery';
  return 'aerobic';
}

interface TodayWorkoutCardProps {
  todayData?: TodayResponse | null;
  isLoading?: boolean;
  error?: unknown;
  trainingLoad7d?: TrainingLoadData | null;
  activities10?: CompletedActivity[] | null;
  todayIntelligence?: unknown;
  /** Additional CSS classes */
  className?: string;
}

export function TodayWorkoutCard(props: TodayWorkoutCardProps = {}) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const navigate = useNavigate();
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);

  // Use props if provided, otherwise fetch (backward compatibility)
  const propsTodayData = props.todayData;
  const propsIsLoading = props.isLoading;
  const propsError = props.error;
  const propsTrainingLoad7d = props.trainingLoad7d;
  const propsActivities10 = props.activities10;
  const propsTodayIntelligence = props.todayIntelligence;
  const cardClassName = props.className;

  const { data: todayData, isLoading: todayDataLoading, error: todayDataError } = useAuthenticatedQuery({
    queryKey: ['calendarToday', today],
    queryFn: () => fetchCalendarToday(today),
    retry: 1,
    enabled: propsTodayData === undefined,
  });

  const { data: trainingLoadData } = useAuthenticatedQuery<TrainingLoadData>({
    queryKey: ['trainingLoad', 7],
    queryFn: () => {
      console.log('[TodayWorkoutCard] Fetching training load for 7 days');
      return fetchTrainingLoad(7);
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
    enabled: propsTrainingLoad7d === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: activities } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 10],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    enabled: propsActivities10 === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: todayIntelligence } = useAuthenticatedQuery({
    queryKey: ['intelligence', 'today', 'current'],
    queryFn: () => getTodayIntelligence(),
    retry: 1,
    enabled: propsTodayIntelligence === undefined,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  // Use props if provided, otherwise use fetched data
  const finalTodayData = propsTodayData !== undefined ? propsTodayData : todayData;
  const isLoading = propsIsLoading !== undefined ? propsIsLoading : todayDataLoading;
  const error = propsError !== undefined ? propsError : todayDataError;
  const finalTrainingLoadData = propsTrainingLoad7d !== undefined ? propsTrainingLoad7d : trainingLoadData;
  const finalActivities = propsActivities10 !== undefined ? propsActivities10 : activities;
  const finalTodayIntelligence = propsTodayIntelligence !== undefined ? propsTodayIntelligence : todayIntelligence;

  const todayWorkout = finalTodayData?.sessions?.find(s => s.status === 'planned' || s.status === 'completed') || null;

  const matchingActivity = useMemo(() => {
    if (!todayWorkout || !finalActivities) return null;
    if (todayWorkout.completed_activity_id) {
      return finalActivities.find(activity => activity.id === todayWorkout.completed_activity_id) || null;
    }
    const byDate = finalActivities.find(activity => {
      const activityDate = activity.date?.split('T')[0] || activity.date;
      return activityDate === today;
    });
    return byDate || null;
  }, [finalActivities, today, todayWorkout]);

  const activityId = todayWorkout?.completed_activity_id || matchingActivity?.id || null;

  const { data: activityStreams } = useAuthenticatedQuery({
    queryKey: ['activityStreams', activityId],
    queryFn: () => fetchActivityStreams(activityId as string),
    retry: 1,
    enabled: Boolean(activityId),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Phase 4: SessionCard handles visual representation directly from CalendarSession

  // Check if verdict/decision suggests modification (REST, MODIFY, or CANCEL)
  // MUST be called before any early returns to follow Rules of Hooks
  const shouldSuggestModification = useMemo(() => {
    if (!finalTodayIntelligence) return false;
    
    // Check for v2 format
    if (typeof finalTodayIntelligence === 'object' && 'version' in finalTodayIntelligence) {
      const v2 = finalTodayIntelligence as { version?: string; decision?: string };
      if (v2.version === 'coach_decision_v2') {
        const decision = v2.decision;
        return decision === 'REST' || decision === 'MODIFY' || decision === 'CANCEL';
      }
    }
    
    // Check for v1 format
    if (typeof finalTodayIntelligence === 'object' && 'recommendation' in finalTodayIntelligence) {
      const rec = (finalTodayIntelligence as { recommendation?: string }).recommendation;
      if (rec) {
        const lower = rec.toLowerCase();
        return lower === 'rest' || lower.includes('modify') || lower.includes('cancel');
      }
    }
    
    return false;
  }, [finalTodayIntelligence]);

  const getModificationSuggestion = useMemo(() => {
    if (!finalTodayIntelligence) return null;
    
    // Check for v2 format
    if (typeof finalTodayIntelligence === 'object' && 'version' in finalTodayIntelligence) {
      const v2 = finalTodayIntelligence as { version?: string; decision?: string; explanation?: string };
      if (v2.version === 'coach_decision_v2') {
        const decision = v2.decision;
        if (decision === 'REST') {
          return {
            type: 'rest' as const,
            message: 'The coach suggests considering rest today based on your recovery signals. Would you like to modify or skip this workout?',
            explanation: v2.explanation,
          };
        }
        if (decision === 'MODIFY') {
          return {
            type: 'modify' as const,
            message: 'The coach suggests modifying this workout based on your current state. Would you like to adjust the intensity or distance?',
            explanation: v2.explanation,
          };
        }
        if (decision === 'CANCEL') {
          return {
            type: 'cancel' as const,
            message: 'The coach suggests canceling this workout today. Would you like to skip it?',
            explanation: v2.explanation,
          };
        }
      }
    }
    
    // Check for v1 format
    if (typeof finalTodayIntelligence === 'object' && 'recommendation' in finalTodayIntelligence) {
      const rec = (finalTodayIntelligence as { recommendation?: string; explanation?: string }).recommendation;
      if (rec) {
        const lower = rec.toLowerCase();
        if (lower === 'rest') {
          return {
            type: 'rest' as const,
            message: 'The coach suggests considering rest today. Would you like to modify or skip this workout?',
            explanation: (finalTodayIntelligence as { explanation?: string }).explanation,
          };
        }
      }
    }
    
    return null;
  }, [finalTodayIntelligence]);

  if (isLoading) {
    return (
      <Card className={cn('h-full flex flex-col', cardClassName)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Session</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Detect if there's no planned session (rest day)
  const hasNoPlannedSession = !error && (!finalTodayData?.sessions || 
    finalTodayData.sessions.filter(s => s.status === 'planned' || s.status === 'completed').length === 0);

  if (error) {
    return (
      <Card className={cn('h-full flex flex-col', cardClassName)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Session</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">
            Unable to load session
          </p>
        </CardContent>
      </Card>
    );
  }

  if (hasNoPlannedSession) {
    return (
      <Card className={cn('h-full flex flex-col', cardClassName)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Session</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Moon className="h-5 w-5" />
              <span className="font-semibold text-foreground">REST DAY PROTOCOL</span>
            </div>
            
            <ul className="space-y-2">
              <li className="text-sm text-foreground flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-1">•</span>
                <span>No scheduled training</span>
              </li>
              <li className="text-sm text-foreground flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-1">•</span>
                <span>Light movement optional</span>
              </li>
              <li className="text-sm text-foreground flex items-start gap-2">
                <span className="text-muted-foreground/60 mt-1">•</span>
                <span>Focus on recovery behaviors</span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/coach">
                  <Brain className="h-3.5 w-3.5 mr-1.5" />
                  View recovery guidance
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/schedule">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  See week overview
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!todayWorkout) {
    return (
      <Card className={cn('h-full flex flex-col', cardClassName)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Session</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">
            No session available
          </p>
        </CardContent>
      </Card>
    );
  }

  const workoutType = todayWorkout.type || '';
  const workoutIntent = mapTypeToIntent(workoutType);
  const isCompleted = todayWorkout.status === 'completed' || Boolean(matchingActivity);

  // Map intent to badge variant
  function getIntentVariant(intent: WorkoutIntent): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (intent) {
      case 'recovery': return 'secondary';
      case 'aerobic': return 'default';
      case 'endurance': return 'default';
      case 'threshold': return 'outline';
      case 'vo2': return 'destructive';
    }
  }

  // Get workout steps from todayWorkout (canonical source)
  const workoutSteps = todayWorkout.steps || [];
  const executionNotes = todayWorkout.execution_notes;
  const mustDos = todayWorkout.must_dos || [];

  // Generate draft message for modification request
  const getGenericDraftMessage = (): string => {
    return "Today was marked as a REST day based on my recovery signals.\nCan you modify today's planned session accordingly (e.g., reduce volume, replace with recovery, or skip)?";
  };

  // Handle navigation to coach with pre-filled message
  const handleModifyRequest = () => {
    const sessionId = todayWorkout.id || null;
    const draftMessage = getGenericDraftMessage();
    
    navigate('/coach', {
      state: {
        context: 'modify_today_session',
        session_id: sessionId,
        suggested_action: 'generic',
        draft_message: draftMessage,
      },
    });
  };

  return (
    <div className={cn('space-y-4', cardClassName)}>
      {/* Coach Suggestion Card - show if verdict suggests modification */}
      {shouldSuggestModification && getModificationSuggestion && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Brain className="h-4 w-4" />
              Coach Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground mb-2">
              {getModificationSuggestion.message}
            </p>
            {getModificationSuggestion.explanation && (
              <p className="text-xs text-muted-foreground italic">
                {getModificationSuggestion.explanation}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <Button 
                onClick={handleModifyRequest}
                size="sm"
                className="bg-coach hover:bg-coach/90 text-coach-foreground"
              >
                Ask Coach to Modify Today's Session
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/coach">
                  Discuss with Coach
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main workout card - non-compact mode to show effort graph */}
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Today's Session</CardTitle>
          <Badge variant={isCompleted ? 'default' : getIntentVariant(workoutIntent)}>
            {isCompleted ? 'Completed' : (todayWorkout.intensity || workoutType || 'Planned')}
          </Badge>
        </CardHeader>
        <CardContent className="flex-1 py-2">
          {/* Phase 4: React-based SessionCard (standard density) */}
          {todayWorkout && (
            <SessionCard
              session={todayWorkout}
              density="standard"
              onClick={todayWorkout.workout_id ? () => setShowWorkoutDetails(!showWorkoutDetails) : undefined}
            />
          )}
        </CardContent>
      </Card>

      {/* Expandable Workout Details */}
      {todayWorkout && (
        <WorkoutDetailCard
          session={todayWorkout}
          expanded={showWorkoutDetails}
          onToggleExpand={() => setShowWorkoutDetails(!showWorkoutDetails)}
        />
      )}

      {/* Must-Dos Card - show unified must-do instructions (priority) */}
      {mustDos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.5 4.5L6 12L2.5 8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              Must-Dos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {mustDos.map((mustDo, index) => (
                <li key={index} className="text-sm leading-relaxed text-foreground flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{mustDo}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Execution Notes Card - show execution notes (secondary to must-dos) */}
      {executionNotes && mustDos.length === 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <svg
                className="w-4 h-4 text-muted-foreground"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.4" />
                <path
                  d="M8 2L8 8L12 10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.6"
                />
                <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.6" />
              </svg>
              Execution Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground">{executionNotes}</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
