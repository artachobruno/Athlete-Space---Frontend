import { startOfMonth, endOfMonth, format, parseISO, isWithinInterval } from 'date-fns';
import { fetchCalendarSeason, fetchActivities, type CalendarSession } from '@/lib/api';
import type { CompletedActivity } from '@/types';
import type { CalendarItem } from '@/types/calendar';
import { normalizeCalendarSport } from '@/types/calendar';
import { toCalendarItem } from '@/adapters/calendarAdapter';

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
    (s) => s.status !== 'completed' && s.status !== 'deleted' && s.status !== 'skipped'
  );
  const workouts = monthSessions.filter((s) => s.status === 'completed');

  // Fetch activities for the month using date range filtering
  const monthActivities = await fetchActivities({ 
    start: monthStartStr,
    end: monthEndStr,
    limit: 1000 // High limit to get all activities in month range
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

function sportKey(s: CalendarSession): string {
  return normalizeCalendarSport(s.type ?? null, s.title ?? null);
}

/**
 * Prefer the workout that has activity linkage (completed_activity_id, workout_id) or
 * matches an activity in completedActivities. Used when merging 2 workouts same sport.
 */
function pickBestWorkout(
  a: CalendarSession,
  b: CalendarSession,
  completedActivities: CompletedActivity[],
): CalendarSession {
  const score = (s: CalendarSession): number => {
    if (s.completed_activity_id || s.workout_id) return 2;
    const hasMatch = completedActivities.some(
      (act) => act.id === s.id || act.planned_session_id === s.id,
    );
    return hasMatch ? 1 : 0;
  };
  return score(b) > score(a) ? b : a;
}

/**
 * Build calendar items for a day, merging duplicate planned+workout same sport into one combined card.
 * - 1 planned + 1 workout same sport -> emit 1 (workout).
 * - 2 workouts, 0 planned same sport -> emit 1 (duplicate: completed plan + unpaired activity).
 * - Otherwise emit all.
 */
export function buildMergedCalendarItemsForDay(
  dayData: DayCalendarData,
  completedActivities: CompletedActivity[],
): CalendarItem[] {
  const bySportPlanned = new Map<string, CalendarSession[]>();
  const bySportWorkouts = new Map<string, CalendarSession[]>();

  for (const s of dayData.plannedSessions) {
    const k = sportKey(s);
    const list = bySportPlanned.get(k) ?? [];
    list.push(s);
    bySportPlanned.set(k, list);
  }
  for (const w of dayData.workouts) {
    const k = sportKey(w);
    const list = bySportWorkouts.get(k) ?? [];
    list.push(w);
    bySportWorkouts.set(k, list);
  }

  const sports = new Set<string>([
    ...bySportPlanned.keys(),
    ...bySportWorkouts.keys(),
  ]);
  const toEmit: CalendarSession[] = [];

  for (const sport of [...sports].sort()) {
    const planned = bySportPlanned.get(sport) ?? [];
    const workouts = bySportWorkouts.get(sport) ?? [];
    if (planned.length === 1 && workouts.length === 1) {
      toEmit.push(workouts[0]);
    } else if (planned.length === 0 && workouts.length === 2) {
      toEmit.push(
        pickBestWorkout(workouts[0], workouts[1], completedActivities),
      );
    } else {
      toEmit.push(...planned);
      toEmit.push(...workouts);
    }
  }

  return toEmit.map((s) => toCalendarItem(s, completedActivities));
}
