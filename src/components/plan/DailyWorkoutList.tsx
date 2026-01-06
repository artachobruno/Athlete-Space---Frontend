import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday, isBefore, isSameDay } from 'date-fns';
import { mockPlannedWorkouts, mockActivities, getTodayDecision } from '@/lib/mock-data';
import { DailyWorkoutCard } from './DailyWorkoutCard';

export function DailyWorkoutList() {
  const weekDays = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const workout = mockPlannedWorkouts.find(w => w.date === dateStr);
      const completed = mockActivities.find(a => a.date === dateStr);
      
      // Determine status
      let status: 'upcoming' | 'today' | 'completed' | 'missed' = 'upcoming';
      if (isToday(date)) {
        status = 'today';
      } else if (isBefore(date, today) && !isToday(date)) {
        status = completed ? 'completed' : (workout ? 'missed' : 'completed');
      }

      // Get daily decision for today
      const dailyDecision = isToday(date) ? getTodayDecision() : null;

      return {
        date,
        workout,
        completed,
        status,
        dailyDecision,
      };
    });
  }, []);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Daily Schedule</h3>
      <div className="space-y-3">
        {weekDays.map((day) => (
          <DailyWorkoutCard
            key={day.date.toString()}
            date={day.date}
            workout={day.workout}
            completed={day.completed}
            status={day.status}
            dailyDecision={day.dailyDecision}
          />
        ))}
      </div>
    </div>
  );
}
