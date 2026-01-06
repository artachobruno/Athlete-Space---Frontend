import { useMemo } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarWeek, fetchActivities } from '@/lib/api';
import { Footprints, Bike, Waves, Clock, Route, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import type { PlannedWorkout, CompletedActivity } from '@/types';

interface WeekViewProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null) => void;
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

const mapSessionToWorkout = (session: import('@/lib/api').CalendarSession): PlannedWorkout | null => {
  if (session.status === 'completed') return null;
  return {
    id: session.id,
    date: session.date,
    sport: session.type as PlannedWorkout['sport'],
    intent: 'aerobic' as PlannedWorkout['intent'],
    title: session.title,
    description: session.notes || '',
    duration: session.duration_minutes || 0,
    distance: session.distance_km || undefined,
    completed: false,
  };
};

export function WeekView({ currentDate, onActivityClick }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData, isLoading: weekLoading, error: weekError } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  // Debug logging
  if (weekData) {
    console.log('[WeekView] Week data received:', weekData);
    console.log('[WeekView] Sessions count:', weekData.sessions?.length || 0);
  }
  if (weekError) {
    console.error('[WeekView] Error loading week data:', weekError);
  }

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'week'],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
  });

  const days = useMemo(() => {
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, weekStart]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    // Debug logging for specific day
    if (weekData?.sessions) {
      const allSessionsForDay = weekData.sessions.filter(s => s.date === dateStr);
      if (allSessionsForDay.length > 0) {
        console.log(`[WeekView] Found ${allSessionsForDay.length} sessions for ${dateStr}:`, allSessionsForDay);
      }
    }
    
    const plannedSessions = weekData?.sessions?.filter(s => {
      // Normalize date strings for comparison (handle timezone issues)
      const sessionDate = s.date?.split('T')[0] || s.date;
      return sessionDate === dateStr && s.status === 'planned';
    }) || [];
    
    const planned = plannedSessions.map(mapSessionToWorkout).filter((w): w is PlannedWorkout => w !== null);
    const completed = (activities || []).filter((a: CompletedActivity) => {
      const activityDate = a.date?.split('T')[0] || a.date;
      return activityDate === dateStr;
    });
    return { planned, completed };
  };

  if (weekLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (weekError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">Unable to load calendar data</p>
        <p className="text-xs text-muted-foreground">
          {weekError instanceof Error ? weekError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  // Show debug info if no sessions found
  if (weekData && (!weekData.sessions || weekData.sessions.length === 0)) {
    console.warn('[WeekView] No sessions found in week data:', weekData);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((day) => {
        const { planned, completed } = getWorkoutsForDay(day);
        const isCurrentDay = isToday(day);

        return (
          <Card
            key={day.toString()}
            className={cn(
              'p-3',
              isCurrentDay && 'ring-2 ring-accent'
            )}
          >
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEEE')}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isCurrentDay && 'text-accent'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
              {isCurrentDay && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                  Today
                </Badge>
              )}
            </div>

            {/* Workouts */}
            <div className="space-y-2">
              {planned.length === 0 && completed.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Rest day
                </p>
              )}

              {planned.map((workout) => {
                const Icon = sportIcons[workout.sport];
                const matchingActivity = completed.find(c =>
                  isSameDay(new Date(c.date), new Date(workout.date)) &&
                  c.sport === workout.sport
                );
                const isCompleted = !!matchingActivity;

                return (
                  <div
                    key={workout.id}
                    className={cn(
                      'p-2 rounded-lg border cursor-pointer transition-all hover:ring-1 hover:ring-accent/50',
                      isCompleted
                        ? 'bg-load-fresh/10 border-load-fresh/30'
                        : 'bg-muted/50 border-border'
                    )}
                    onClick={() => onActivityClick?.(workout, matchingActivity || null)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {workout.title}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-load-fresh ml-auto shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {workout.duration}m
                      </span>
                      {workout.distance !== undefined && workout.distance > 0 && (
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {workout.distance.toFixed(1)}km
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', intentColors[workout.intent])}
                      >
                        {workout.intent}
                      </Badge>
                      <MessageCircle className="h-3 w-3 text-muted-foreground opacity-50" />
                    </div>
                  </div>
                );
              })}

              {/* Completed without plan */}
              {completed
                .filter(c => !planned.some(p => p.sport === c.sport))
                .map((activity) => {
                  const Icon = sportIcons[activity.sport];
                  return (
                    <div
                      key={activity.id}
                      className="p-2 rounded-lg border bg-accent/10 border-accent/30 cursor-pointer hover:ring-1 hover:ring-accent/50"
                      onClick={() => onActivityClick?.(null, activity)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium truncate">
                          {activity.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {(activity.distance || 0).toFixed(1)}km
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
