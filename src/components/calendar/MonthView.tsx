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
  eachWeekOfInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarWeek, fetchActivities } from '@/lib/api';
import { Footprints, Bike, Waves, CheckCircle2, MessageCircle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { PlannedWorkout, CompletedActivity } from '@/types';

interface MonthViewProps {
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
  aerobic: 'bg-training-aerobic',
  threshold: 'bg-training-threshold',
  vo2: 'bg-training-vo2',
  endurance: 'bg-training-endurance',
  recovery: 'bg-training-recovery',
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

export function MonthView({ currentDate, onActivityClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Fetch data for all weeks in the month
  const weeks = useMemo(() => {
    return eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
  }, [monthStart, monthEnd]);

  const weekQueries = weeks.map(weekStart => {
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    return useQuery({
      queryKey: ['calendarWeek', weekStartStr],
      queryFn: () => fetchCalendarWeek(weekStartStr),
      retry: 1,
    });
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'month'],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
  });

  const isLoading = weekQueries.some(q => q.isLoading) || activitiesLoading;
  const allWeekData = weekQueries.map(q => q.data).filter(Boolean);

  const days = useMemo(() => {
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, monthStart, monthEnd]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const allSessions = allWeekData.flatMap(w => w?.sessions || []);
    const plannedSessions = allSessions.filter(s => s.date === dateStr && s.status === 'planned');
    const planned = plannedSessions.map(mapSessionToWorkout).filter((w): w is PlannedWorkout => w !== null);
    const completed = (activities || []).filter((a: CompletedActivity) => a.date === dateStr);
    return { planned, completed };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
                  const matchingActivity = completed.find(c => 
                    isSameDay(new Date(c.date), new Date(workout.date)) && 
                    c.sport === workout.sport
                  );
                  const isCompleted = !!matchingActivity;

                  return (
                    <div
                      key={workout.id}
                      className={cn(
                        'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs group cursor-pointer hover:ring-1 hover:ring-accent/50',
                        isCompleted
                          ? 'bg-load-fresh/20 text-load-fresh'
                          : 'bg-muted text-muted-foreground'
                      )}
                      onClick={() => onActivityClick?.(workout, matchingActivity || null)}
                    >
                      <Icon className="h-3 w-3 shrink-0" />
                      <span className="truncate">{workout.title}</span>
                      {isCompleted ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0 ml-auto" />
                      ) : (
                        <MessageCircle className="h-3 w-3 shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
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
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-accent/20 text-accent cursor-pointer hover:ring-1 hover:ring-accent/50"
                        onClick={() => onActivityClick?.(null, activity)}
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
