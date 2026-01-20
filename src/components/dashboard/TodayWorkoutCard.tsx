import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchCalendarToday, fetchTrainingLoad, fetchActivities, fetchActivityStreams } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { format } from 'date-fns';
import { Loader2, Clock, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useMemo } from 'react';
import { getTssForDate, enrichActivitiesWithTss, type TrainingLoadData } from '@/lib/tss-utils';
import { WorkoutCard } from '@/components/workout/WorkoutCard';
import { BaseCalendarCardSvg } from '@/components/calendar/cards/BaseCalendarCardSvg';
import { WorkoutStepsBar, SimpleWorkoutBar } from '@/components/workout/WorkoutStepsBar';
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout';
import type { CompletedActivity } from '@/types';
import type { TodayResponse } from '@/lib/api';
import { normalizeSportType } from '@/lib/session-utils';

// F1 Design: Map workout intent to status
type WorkoutIntent = 'aerobic' | 'threshold' | 'vo2' | 'endurance' | 'recovery';

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
  /** Additional CSS classes */
  className?: string;
}

export function TodayWorkoutCard(props: TodayWorkoutCardProps = {}) {
  const today = format(new Date(), 'yyyy-MM-dd');

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

  // Fetch structured workout for steps bar (must be before early returns)
  const structuredWorkoutState = useStructuredWorkout(
    todayWorkout?.workout_id ?? undefined
  );

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

  if (error || !todayWorkout) {
    return (
      <Card className={cn('h-full flex flex-col', cardClassName)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Session</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-4">
          <p className="text-sm text-muted-foreground">
            {error ? 'Unable to load session' : 'Rest day - no session scheduled'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const workoutType = todayWorkout.type || '';
  const workoutIntent = mapTypeToIntent(workoutType);
  const isCompleted = todayWorkout.status === 'completed' || Boolean(matchingActivity);
  const sport = normalizeSportType(todayWorkout.type);

  // Map intent to badge variant
  const getIntentVariant = (intent: WorkoutIntent): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (intent) {
      case 'recovery': return 'secondary';
      case 'aerobic': return 'default';
      case 'endurance': return 'default';
      case 'threshold': return 'outline';
      case 'vo2': return 'destructive';
    }
  };

  // Determine calendar card variant for planned sessions
  const getCalendarVariant = (): string => {
    if (isCompleted) {
      return `completed-${sport}`;
    }
    return `planned-${sport}`;
  };

  // Format duration for display
  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  // Get structured steps for the workout bar
  const structuredSteps = (!isCompleted && structuredWorkoutState.status === 'ready')
    ? structuredWorkoutState.data.steps 
    : [];

  return (
    <Card className={cn('h-full flex flex-col', cardClassName)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">Today's Session</CardTitle>
        <Badge variant={isCompleted ? 'default' : getIntentVariant(workoutIntent)}>
          {isCompleted ? 'Completed' : (todayWorkout.intensity || workoutType || 'Planned')}
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 py-2">
        {isCompleted ? (
          // Completed: Show WorkoutCard with map/route
          <WorkoutCard
            session={todayWorkout}
            activity={matchingActivity}
            streams={activityStreams ?? null}
            tss={todayTss}
            variant="feed"
          />
        ) : (
          // Planned: Show calendar-style card with workout steps bar
          <div className="flex flex-col h-full">
            {/* Card with same aspect ratio as WorkoutCard */}
            <div className="flex-1" style={{ aspectRatio: '600 / 360' }}>
              <BaseCalendarCardSvg
                variant={getCalendarVariant()}
                topLeft={todayWorkout.intensity || workoutType || 'Session'}
                topRight={todayWorkout.duration_minutes ? formatDuration(todayWorkout.duration_minutes) : ''}
                title={todayWorkout.title || 'Planned Workout'}
                description={todayWorkout.notes || null}
                isPlanned={true}
                viewVariant="week"
              />
            </div>
            
            {/* Workout Steps Bar - shows workout structure */}
            <div className="mt-3">
              {structuredSteps.length > 0 ? (
                <WorkoutStepsBar steps={structuredSteps} />
              ) : (
                <SimpleWorkoutBar 
                  intensity={todayWorkout.intensity || workoutType || 'moderate'} 
                  durationMinutes={todayWorkout.duration_minutes || 60}
                />
              )}
            </div>

            {/* Quick metrics for planned session */}
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              {todayWorkout.duration_minutes && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {formatDuration(todayWorkout.duration_minutes)}
                </span>
              )}
              {todayWorkout.distance_km && (
                <span className="flex items-center gap-1.5">
                  <Route className="h-4 w-4" />
                  {todayWorkout.distance_km.toFixed(1)} km
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
