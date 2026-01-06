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
import { mockPlannedWorkouts, mockActivities } from '@/lib/mock-data';
import { Footprints, Bike, Waves, Clock, Route, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WeekViewProps {
  currentDate: Date;
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

export function WeekView({ currentDate }: WeekViewProps) {
  const days = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const planned = mockPlannedWorkouts.filter(w => w.date === dateStr);
    const completed = mockActivities.filter(a => a.date === dateStr);
    return { planned, completed };
  };

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
                const isCompleted = completed.some(c =>
                  isSameDay(new Date(c.date), new Date(workout.date)) &&
                  c.sport === workout.sport
                );

                return (
                  <div
                    key={workout.id}
                    className={cn(
                      'p-2 rounded-lg border',
                      isCompleted
                        ? 'bg-load-fresh/10 border-load-fresh/30'
                        : 'bg-muted/50 border-border'
                    )}
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
                      {workout.distance && (
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {workout.distance}km
                        </span>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('mt-2 text-xs', intentColors[workout.intent])}
                    >
                      {workout.intent}
                    </Badge>
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
                      className="p-2 rounded-lg border bg-accent/10 border-accent/30"
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
                          {activity.distance}km
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
