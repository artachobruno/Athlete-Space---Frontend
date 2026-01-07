import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchCalendarToday, fetchTrainingLoad, fetchActivities } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { format } from 'date-fns';
import { Clock, Route, Zap, Loader2, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useMemo } from 'react';
import { getTssForDate, enrichActivitiesWithTss } from '@/lib/tss-utils';

const intentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
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

export function TodayWorkoutCard() {
  const { convertDistance } = useUnitSystem();
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayData, isLoading, error } = useQuery({
    queryKey: ['calendarToday', today],
    queryFn: () => fetchCalendarToday(today),
    retry: 1,
  });

  const { data: trainingLoadData } = useQuery({
    queryKey: ['trainingLoad', 7],
    queryFn: () => fetchTrainingLoad(7),
    retry: 1,
  });

  const { data: activities } = useQuery({
    queryKey: ['activities', 'today'],
    queryFn: () => fetchActivities({ limit: 10 }),
    retry: 1,
  });

  const { data: todayIntelligence } = useQuery({
    queryKey: ['intelligence', 'today', 'current'],
    queryFn: () => getTodayIntelligence(),
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - intelligence is expensive LLM call
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  const todayWorkout = todayData?.sessions?.find(s => s.status === 'planned' || s.status === 'completed') || null;
  
  // Get TSS for today from training load or completed activity
  const todayTss = useMemo(() => {
    if (todayWorkout?.status === 'completed') {
      // Try to find matching completed activity
      const enrichedActivities = enrichActivitiesWithTss(activities || [], trainingLoadData);
      const matchingActivity = enrichedActivities.find(a => {
        const activityDate = a.date?.split('T')[0] || a.date;
        return activityDate === today;
      });
      if (matchingActivity?.trainingLoad) {
        return matchingActivity.trainingLoad;
      }
    }
    // Fallback to training load data
    return getTssForDate(today, trainingLoadData);
  }, [todayWorkout, today, activities, trainingLoadData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !todayWorkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>{error ? 'Unable to load workout' : 'Rest day - no workout scheduled'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const workoutType = todayWorkout.type || '';
  const workoutIntent = mapTypeToIntent(workoutType);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Workout</CardTitle>
          <Badge variant="outline" className={cn(intentColors[workoutIntent])}>
            {todayWorkout.intensity || workoutType || 'Workout'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{todayWorkout.title}</h3>
          {todayWorkout.notes && (
            <p className="text-sm text-muted-foreground mt-1">{todayWorkout.notes}</p>
          )}
        </div>

        {/* Coach Explanation */}
        {todayIntelligence && 'explanation' in todayIntelligence && todayIntelligence.explanation && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Coach&apos;s Explanation
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {todayIntelligence.explanation}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6 text-sm">
          {todayWorkout.duration_minutes && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{todayWorkout.duration_minutes} min</span>
            </div>
          )}
          {todayWorkout.distance_km && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span>{(() => {
                const dist = convertDistance(todayWorkout.distance_km);
                return `${dist.value.toFixed(1)} ${dist.unit}`;
              })()}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="capitalize">{workoutType || 'Workout'}</span>
          </div>
          {todayTss !== null && todayTss > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">{Math.round(todayTss)}</span>
              <span className="text-xs">TSS</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
