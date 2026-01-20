import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel, F1StatusBadge } from '@/components/ui/f1-card';
import { fetchCalendarToday, fetchTrainingLoad, fetchActivities, fetchActivityStreams } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { format } from 'date-fns';
import { Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useMemo } from 'react';
import { getTssForDate, enrichActivitiesWithTss, type TrainingLoadData } from '@/lib/tss-utils';
import { getGlowIntensityFromWorkout } from '@/lib/intensityGlow';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import type { CompletedActivity } from '@/types';
import type { TodayResponse } from '@/lib/api';

// F1 Design: Map workout intent to F1 glow and status
type WorkoutIntent = 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery';
type F1Glow = 'recovery' | 'aerobic' | 'tempo' | 'threshold' | 'vo2';

const intentToGlow: Record<WorkoutIntent, F1Glow> = {
  recovery: 'recovery',
  aerobic: 'aerobic',
  endurance: 'aerobic',
  threshold: 'threshold',
  vo2: 'vo2',
};

const mapTypeToIntent = (type: string | null | undefined): 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery' => {
  if (!type || typeof type !== 'string') {
    return 'aerobic';
  }
  const lower = type.toLowerCase();
  if (lower.includes('threshold') || lower.includes('tempo')) return 'threshold';
  if (lower.includes('vo2') || lower.includes('interval')) return 'vo2';
  if (lower.includes('endurance') || lower.includes('long')) return 'endurance';
  if (lower.includes('recovery') || lower.includes('easy')) return 'recovery';
  return 'aerobic';
};

interface TodayWorkoutCardProps {
  todayData?: TodayResponse | null;
  isLoading?: boolean;
  error?: unknown;
  trainingLoad7d?: TrainingLoadData | null;
  activities10?: CompletedActivity[] | null;
  todayIntelligence?: unknown;
}

export function TodayWorkoutCard(props?: TodayWorkoutCardProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Use props if provided, otherwise fetch (backward compatibility)
  const propsTodayData = props?.todayData;
  const propsIsLoading = props?.isLoading;
  const propsError = props?.error;
  const propsTrainingLoad7d = props?.trainingLoad7d;
  const propsActivities10 = props?.activities10;
  const propsTodayIntelligence = props?.todayIntelligence;

  const { data: todayData, isLoading: todayDataLoading, error: todayDataError } = useAuthenticatedQuery({
    queryKey: ['calendarToday', today],
    queryFn: () => fetchCalendarToday(today),
    retry: 1,
    enabled: propsTodayData === undefined, // Only fetch if props not provided
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
    enabled: propsTrainingLoad7d === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const { data: activities } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 10],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
    enabled: propsActivities10 === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: todayIntelligence } = useAuthenticatedQuery({
    queryKey: ['intelligence', 'today', 'current'],
    queryFn: () => getTodayIntelligence(),
    retry: 1,
    enabled: propsTodayIntelligence === undefined, // Only fetch if props not provided
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
  
  // Get TSS for today from training load or completed activity
  const todayTss = useMemo(() => {
    if (todayWorkout?.status === 'completed') {
      // Try to find matching completed activity
      const enrichedActivities = enrichActivitiesWithTss(finalActivities || [], finalTrainingLoadData);
      const activity = enrichedActivities.find(a => {
        const activityDate = a.date?.split('T')[0] || a.date;
        return activityDate === today;
      });
      if (activity?.trainingLoad) {
        return activity.trainingLoad;
      }
    }
    // Fallback to training load data
    return getTssForDate(today, finalTrainingLoadData);
  }, [todayWorkout, today, finalActivities, finalTrainingLoadData]);

  if (isLoading) {
    return (
      <F1Card variant="strong">
        <F1CardHeader>
          <F1CardTitle>Today's Workout</F1CardTitle>
        </F1CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--f1-text-tertiary))]" />
        </div>
      </F1Card>
    );
  }

  if (error || !todayWorkout) {
    return (
      <F1Card variant="strong">
        <F1CardHeader>
          <F1CardTitle>Today's Workout</F1CardTitle>
        </F1CardHeader>
        <div className="text-center py-8">
          <p className="f1-body text-[hsl(var(--f1-text-tertiary))]">
            {error ? 'Unable to load workout' : 'Rest day - no workout scheduled'}
          </p>
        </div>
      </F1Card>
    );
  }

  const workoutType = todayWorkout.type || '';
  const workoutIntent = mapTypeToIntent(workoutType);
  const glowIntensity = getGlowIntensityFromWorkout(todayWorkout.intensity, workoutType);
  const f1Glow = intentToGlow[workoutIntent];

  // Map glow intensity to F1 status for badge
  const getIntentStatus = (intent: WorkoutIntent): 'safe' | 'caution' | 'danger' | 'active' => {
    switch (intent) {
      case 'recovery': return 'safe';
      case 'aerobic': return 'active';
      case 'endurance': return 'active';
      case 'threshold': return 'caution';
      case 'vo2': return 'danger';
    }
  };

  return (
    <F1Card variant="strong" glow={f1Glow} actionable>
      <F1CardHeader
        action={
          <F1StatusBadge status={getIntentStatus(workoutIntent)} dot={false}>
            {todayWorkout.intensity || workoutType || 'Workout'}
          </F1StatusBadge>
        }
      >
        <F1CardTitle>Today's Workout</F1CardTitle>
      </F1CardHeader>
      
      <div className="space-y-4">
        <WorkoutCard
          session={todayWorkout}
          activity={matchingActivity}
          streams={activityStreams ?? null}
          tss={todayTss}
          variant="feed"
        />

        {/* Coach Explanation - F1 styled */}
        {(() => {
          const intel = finalTodayIntelligence as Record<string, unknown> | null | undefined;
          const explanation = intel && typeof intel === 'object' && 'explanation' in intel 
            ? String(intel.explanation) 
            : null;
          const confidenceObj = intel && typeof intel === 'object' && 'confidence' in intel ? intel.confidence : null;
          const confidence = confidenceObj && typeof confidenceObj === 'object' && confidenceObj !== null && 'score' in (confidenceObj as Record<string, unknown>)
            ? (confidenceObj as Record<string, unknown>).score
            : null;
          
          // Don't show placeholder message if there's a workout available
          const isPlaceholder = explanation === "The coach is still analyzing your training data. Recommendations will be available soon." 
            || confidence === 0.0 
            || explanation === "Decision not yet generated";
          
          const shouldShowExplanation = explanation && !isPlaceholder;
          
          return shouldShowExplanation ? (
            <div className="bg-[hsl(var(--accent-telemetry)/0.08)] border border-[hsl(var(--accent-telemetry)/0.2)] rounded-f1 p-3">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 f1-status-active mt-0.5 shrink-0" />
                <div className="flex-1">
                  <F1CardLabel className="mb-1 block">Coach&apos;s Explanation</F1CardLabel>
                  <p className="f1-body text-[hsl(var(--f1-text-primary))] leading-relaxed">
                    {explanation}
                  </p>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {todayWorkout.notes && (
          <p className="f1-body-sm text-[hsl(var(--f1-text-tertiary))]">{todayWorkout.notes}</p>
        )}
      </div>
    </F1Card>
  );
}
