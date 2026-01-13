import type { CalendarSession } from '@/lib/api';
import { format, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns';

const today = new Date();

/**
 * Mock calendar sessions that match the mock activities.
 * These sessions are pairable with activities based on date and sport.
 */
export const mockCalendarSessions: CalendarSession[] = [
  // Session matching mock-1 (yesterday - running)
  {
    id: 'session-1',
    date: format(subDays(today, 1), 'yyyy-MM-dd'),
    time: '07:00',
    type: 'running',
    title: 'Easy Run',
    duration_minutes: 45,
    distance_km: 8.0,
    intensity: 'Zone 2',
    status: 'planned',
    notes: 'Steady aerobic run at conversational pace',
  },
  // Session matching mock-2 (2 days ago - cycling)
  {
    id: 'session-2',
    date: format(subDays(today, 2), 'yyyy-MM-dd'),
    time: '18:00',
    type: 'cycling',
    title: 'Tempo Intervals',
    duration_minutes: 75,
    distance_km: 40,
    intensity: 'Sweet Spot',
    status: 'planned',
    notes: '3x12 minutes at sweet spot power with 5 min recovery',
  },
  // Session matching mock-3 (3 days ago - running)
  {
    id: 'session-3',
    date: format(subDays(today, 3), 'yyyy-MM-dd'),
    time: '17:30',
    type: 'running',
    title: 'Threshold Intervals',
    duration_minutes: 55,
    distance_km: 10.5,
    intensity: 'Threshold',
    status: 'planned',
    notes: '5x3 minutes at threshold pace with 2 min recovery',
  },
  // Session matching mock-4 (5 days ago - running)
  {
    id: 'session-4',
    date: format(subDays(today, 5), 'yyyy-MM-dd'),
    time: '08:00',
    type: 'running',
    title: 'Long Run',
    duration_minutes: 95,
    distance_km: 18.0,
    intensity: 'Zone 2',
    status: 'planned',
    notes: 'Build aerobic endurance with controlled long run',
  },
  // Session matching mock-5 (6 days ago - cycling)
  {
    id: 'session-5',
    date: format(subDays(today, 6), 'yyyy-MM-dd'),
    time: '10:00',
    type: 'cycling',
    title: 'Recovery Spin',
    duration_minutes: 40,
    distance_km: 22,
    intensity: 'Very Easy',
    status: 'planned',
    notes: 'Active recovery - keep it easy',
  },
  // Session matching mock-6 (7 days ago - swimming)
  {
    id: 'session-6',
    date: format(subDays(today, 7), 'yyyy-MM-dd'),
    time: '06:30',
    type: 'swimming',
    title: 'Pool Swim - Technique Focus',
    duration_minutes: 50,
    distance_km: 2.0,
    intensity: 'Moderate',
    status: 'planned',
    notes: 'Focus on catch phase and body rotation',
  },
  // Session matching mock-7 (8 days ago - running)
  {
    id: 'session-7',
    date: format(subDays(today, 8), 'yyyy-MM-dd'),
    time: '19:00',
    type: 'running',
    title: 'Track Workout - 400m Repeats',
    duration_minutes: 60,
    distance_km: 12.0,
    intensity: 'VO2max',
    status: 'planned',
    notes: '8x400m at 5K pace with 90s recovery',
  },
  // Session matching mock-8 (9 days ago - cycling)
  {
    id: 'session-8',
    date: format(subDays(today, 9), 'yyyy-MM-dd'),
    time: '14:00',
    type: 'cycling',
    title: 'Hill Repeats',
    duration_minutes: 90,
    distance_km: 38,
    intensity: 'Threshold',
    status: 'planned',
    notes: '5x5 minutes hill repeats at threshold power',
  },
  // Session matching mock-9 (10 days ago - running)
  {
    id: 'session-9',
    date: format(subDays(today, 10), 'yyyy-MM-dd'),
    time: '17:00',
    type: 'running',
    title: 'Easy Recovery Run',
    duration_minutes: 35,
    distance_km: 6.5,
    intensity: 'Zone 1',
    status: 'planned',
    notes: 'Very easy recovery run - keep heart rate low',
  },
  // Session matching mock-10 (12 days ago - triathlon)
  {
    id: 'session-10',
    date: format(subDays(today, 12), 'yyyy-MM-dd'),
    time: '08:00',
    type: 'triathlon',
    title: 'Brick Workout - Bike + Run',
    duration_minutes: 120,
    distance_km: 50,
    intensity: 'Moderate',
    status: 'planned',
    notes: '60 min bike + 20 min transition run',
  },
  // Additional planned sessions for upcoming days
  {
    id: 'session-today',
    date: format(today, 'yyyy-MM-dd'),
    time: '18:00',
    type: 'running',
    title: 'Easy Run',
    duration_minutes: 50,
    distance_km: 9.0,
    intensity: 'Zone 2',
    status: 'planned',
    notes: 'Steady aerobic run at conversational pace',
  },
  {
    id: 'session-tomorrow',
    date: format(addDays(today, 1), 'yyyy-MM-dd'),
    time: '17:30',
    type: 'cycling',
    title: 'Sweet Spot Intervals',
    duration_minutes: 75,
    distance_km: 45,
    intensity: 'Sweet Spot',
    status: 'planned',
    notes: '3x12 minutes at sweet spot power (88-93% FTP)',
  },
  {
    id: 'session-day-after',
    date: format(addDays(today, 2), 'yyyy-MM-dd'),
    time: '07:00',
    type: 'running',
    title: 'Recovery Jog',
    duration_minutes: 30,
    distance_km: 5.0,
    intensity: 'Very Easy',
    status: 'planned',
    notes: 'Very easy recovery run. Walk breaks are fine.',
  },
];

/**
 * Gets mock calendar sessions for a specific week.
 * Filters sessions that fall within the week range.
 */
export function getMockWeekSessions(weekStart?: string): CalendarSession[] {
  let startDate: Date;
  let endDate: Date;

  if (weekStart) {
    startDate = new Date(weekStart);
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
  } else {
    startDate = startOfWeek(today, { weekStartsOn: 1 });
    endDate = endOfWeek(today, { weekStartsOn: 1 });
  }

  const startStr = format(startDate, 'yyyy-MM-dd');
  const endStr = format(endDate, 'yyyy-MM-dd');

  return mockCalendarSessions.filter(session => {
    const sessionDate = session.date;
    return sessionDate >= startStr && sessionDate <= endStr;
  });
}

/**
 * Gets mock calendar sessions for today.
 */
export function getMockTodaySessions(): CalendarSession[] {
  const todayStr = format(today, 'yyyy-MM-dd');
  return mockCalendarSessions.filter(session => session.date === todayStr);
}
