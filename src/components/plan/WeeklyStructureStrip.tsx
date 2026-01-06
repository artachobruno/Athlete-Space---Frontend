import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { mockPlannedWorkouts } from '@/lib/mock-data';
import { Footprints, Bike, Waves, Moon } from 'lucide-react';

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

export function WeeklyStructureStrip() {
  const weekDays = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const workout = mockPlannedWorkouts.find(w => w.date === dateStr);
      
      return {
        date,
        dayName: format(date, 'EEE'),
        dayNum: format(date, 'd'),
        workout,
        isToday: isToday(date),
      };
    });
  }, []);

  return (
    <div className="flex gap-1 overflow-x-auto pb-2">
      {weekDays.map((day) => {
        const Icon = day.workout ? sportIcons[day.workout.sport] : Moon;
        const intentColor = day.workout ? intentColors[day.workout.intent] : 'bg-muted';

        return (
          <div
            key={day.date.toString()}
            className={cn(
              'flex-1 min-w-[80px] p-3 rounded-lg border text-center transition-all',
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
