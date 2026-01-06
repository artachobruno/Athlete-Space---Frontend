import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarWeek } from '@/lib/api';
import { Footprints, Bike, Waves, Moon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { PlannedWorkout } from '@/types';

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

interface WeeklyStructureStripProps {
  onDayClick?: (dateStr: string) => void;
}

export function WeeklyStructureStrip({ onDayClick }: WeeklyStructureStripProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const session = weekData?.sessions?.find(s => s.date === dateStr && s.status === 'planned');
      const workout = session ? mapSessionToWorkout(session) : null;
      
      return {
        date,
        dateStr,
        dayName: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        workout,
        isToday: isToday(date),
      };
    });
  }, [weekData, weekStart]);

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weekDays.map((day) => {
        const Icon = day.workout ? sportIcons[day.workout.sport] : Moon;
        const intentColor = day.workout ? intentColors[day.workout.intent] : 'bg-muted';

        return (
          <div
            key={day.date.toString()}
            onClick={() => onDayClick?.(day.dateStr)}
            className={cn(
              'flex-1 min-w-[80px] p-3 rounded-lg border text-center transition-all cursor-pointer hover:border-accent/50',
              day.isToday
                ? 'border-accent bg-accent/5 ring-1 ring-accent'
                : 'border-border bg-card'
            )}
          >
            <div className="text-xs text-muted-foreground mb-1">{day.dayName}</div>
            <div className={cn(
              'text-sm font-semibold mb-2',
              day.isToday && 'text-accent'
            )}>
              {day.dayNum}
            </div>
            
            {/* Intent indicator */}
            <div className="flex justify-center mb-2">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                day.workout ? `${intentColor}/20` : 'bg-muted/50'
              )}>
                <Icon className={cn(
                  'h-4 w-4',
                  day.workout ? 'text-foreground' : 'text-muted-foreground'
                )} />
              </div>
            </div>
            
            <div className={cn(
              'h-1.5 rounded-full',
              intentColor
            )} />
            
            <div className="text-xs text-muted-foreground mt-2 capitalize truncate">
              {day.workout?.intent || 'Rest'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
