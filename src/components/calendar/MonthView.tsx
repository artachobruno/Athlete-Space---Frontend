import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { mockPlannedWorkouts, mockActivities } from '@/lib/mock-data';
import { Footprints, Bike, Waves, CheckCircle2 } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

const intentColors = {
  aerobic: 'bg-training-aerobic',
  threshold: 'bg-training-threshold',
  vo2: 'bg-training-vo2',
  endurance: 'bg-training-endurance',
  recovery: 'bg-training-recovery',
};

export function MonthView({ currentDate }: MonthViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const planned = mockPlannedWorkouts.filter(w => w.date === dateStr);
    const completed = mockActivities.filter(a => a.date === dateStr);
    return { planned, completed };
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const { planned, completed } = getWorkoutsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'min-h-[100px] p-2 border-b border-r border-border',
                !isCurrentMonth && 'bg-muted/30',
                idx % 7 === 6 && 'border-r-0'
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    !isCurrentMonth && 'text-muted-foreground',
                    isCurrentDay &&
                      'bg-accent text-accent-foreground w-6 h-6 rounded-full flex items-center justify-center'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Workouts */}
              <div className="space-y-1">
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
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
                        isCompleted
                          ? 'bg-load-fresh/20 text-load-fresh'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{workout.title}</span>
                      {isCompleted && (
                        <CheckCircle2 className="h-3 w-3 shrink-0 ml-auto" />
                      )}
                    </div>
                  );
                })}

                {/* Completed activities without a plan */}
                {completed
                  .filter(c => !planned.some(p => p.sport === c.sport))
                  .map((activity) => {
                    const Icon = sportIcons[activity.sport];
                    return (
                      <div
                        key={activity.id}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent"
                      >
                        <Icon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{activity.title}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
