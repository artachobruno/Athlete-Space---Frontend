import { useMemo } from 'react';
import { startOfWeek, addDays, format, isToday, isBefore } from 'date-fns';
import { fetchCalendarWeek, fetchActivities } from '@/lib/api';
import { getTodayIntelligence } from '@/lib/intelligence';
import { DailyWorkoutCard } from './DailyWorkoutCard';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import type { PlannedWorkout, CompletedActivity } from '@/types';

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

export function DailyWorkoutList() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData, isLoading: weekLoading } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'plan'],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
  });

  const { data: todayIntelligence } = useQuery({
    queryKey: ['todayIntelligence'],
    queryFn: getTodayIntelligence,
    retry: 1,
    enabled: isToday(today),
  });

  const weekDays = useMemo(() => {
    if (!weekData || !activities) return [];

    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const session = weekData.sessions?.find(s => s.date === dateStr && s.status === 'planned');
      const workout = session ? mapSessionToWorkout(session) : null;
      
      const completed = activities.find((a: CompletedActivity) => a.date === dateStr);
      
      // Determine status
      let status: 'upcoming' | 'today' | 'completed' | 'missed' = 'upcoming';
      if (isToday(date)) {
        status = 'today';
      } else if (isBefore(date, today) && !isToday(date)) {
        status = completed ? 'completed' : (workout ? 'missed' : 'upcoming');
      }

      // Get daily decision for today
      const dailyDecision = isToday(date) && todayIntelligence ? {
        decision: 'proceed' as const,
        reason: todayIntelligence.explanation || todayIntelligence.recommendation,
      } : null;

      return {
        date,
        dateStr,
        workout,
        completed: completed || undefined,
        status,
        dailyDecision,
      };
    });
  }, [weekData, activities, weekStart, today, todayIntelligence]);

  if (weekLoading || activitiesLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">Daily Schedule</h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Daily Schedule</h3>
      <div className="space-y-3">
        {weekDays.map((day) => (
          <DailyWorkoutCard
            key={day.date.toString()}
            date={day.date}
            dateId={`workout-${day.dateStr}`}
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
