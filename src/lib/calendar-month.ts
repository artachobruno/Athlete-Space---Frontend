import { startOfMonth, endOfMonth, format, parseISO, isWithinInterval } from 'date-fns';
import { fetchCalendarSeason, fetchActivities, type CalendarSession } from '@/lib/api';
import type { CompletedActivity } from '@/types';

/**
 * Month calendar data structure
 */
export interface MonthCalendarData {
  month_start: string;
  month_end: string;
  planned_sessions: CalendarSession[];
  completed_activities: CompletedActivity[];
  workouts: CalendarSession[]; // Matched workouts (completed sessions from calendar)
}

/**
 * Day calendar data structure
 */
export interface DayCalendarData {
  date: string;
  plannedSessions: CalendarSession[];
  completedActivities: CompletedActivity[];
  workouts: CalendarSession[];
}

/**
 * Fetches calendar data for a specific month.
 * Uses fetchCalendarSeason and filters sessions by month range.
 * Also fetches activities for the month.
 * 
 * @param month - Date object representing the month to fetch
 * @returns Month calendar data with planned sessions, completed activities, and workouts
 */
export async function fetchCalendarMonth(month: Date): Promise<MonthCalendarData> {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Fetch season data (contains all sessions)
  const seasonData = await fetchCalendarSeason();
  
  // Filter sessions to the month range
  const monthSessions = (seasonData?.sessions || []).filter((session) => {
    if (!session.date) return false;
    const sessionDate = parseISO(session.date);
    return isWithinInterval(sessionDate, { start: monthStart, end: monthEnd });
  });

  // Separate planned and completed sessions
  const plannedSessions = monthSessions.filter(
    (s) => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'skipped'
  );
  const workouts = monthSessions.filter((s) => s.status === 'completed');

  // Fetch activities for the month
  // Note: fetchActivities doesn't support date filtering, so we fetch all and filter client-side
  // In a production app, you'd want a backend endpoint like GET /activities?start=YYYY-MM-DD&end=YYYY-MM-DD
  const allActivities = await fetchActivities({ limit: 100 });
  
  // Filter activities to the month range
  const monthActivities = (allActivities || []).filter((activity) => {
    if (!activity.date) return false;
    const activityDate = parseISO(activity.date);
    return isWithinInterval(activityDate, { start: monthStart, end: monthEnd });
  });

  return {
    month_start: monthStartStr,
    month_end: monthEndStr,
    planned_sessions: plannedSessions,
    completed_activities: monthActivities,
    workouts: workouts,
  };
}

/**
 * Normalizes month calendar data by grouping sessions and activities by day.
 * 
 * @param monthData - Month calendar data from fetchCalendarMonth
 * @returns Array of day calendar data, one for each day in the month
 */
export function normalizeCalendarMonth(monthData: MonthCalendarData): DayCalendarData[] {
  const { month_start, month_end, planned_sessions, completed_activities, workouts } = monthData;
  
  const monthStart = parseISO(month_start);
  const monthEnd = parseISO(month_end);
  
  // Generate all days in the month
  const days: DayCalendarData[] = [];
  const currentDay = new Date(monthStart);
  
  while (currentDay <= monthEnd) {
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    
    // Filter sessions and activities for this day
    const dayPlannedSessions = planned_sessions.filter((s) => {
      if (!s.date) return false;
      const sessionDate = format(parseISO(s.date), 'yyyy-MM-dd');
      return sessionDate === dateStr;
    });
    
    const dayCompletedActivities = completed_activities.filter((a) => {
      if (!a.date) return false;
      return a.date === dateStr;
    });
    
    const dayWorkouts = workouts.filter((w) => {
      if (!w.date) return false;
      const workoutDate = format(parseISO(w.date), 'yyyy-MM-dd');
      return workoutDate === dateStr;
    });
    
    days.push({
      date: dateStr,
      plannedSessions: dayPlannedSessions,
      completedActivities: dayCompletedActivities,
      workouts: dayWorkouts,
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return days;
}
