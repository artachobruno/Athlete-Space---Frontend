/**
 * Mock data for Coach Dashboard
 * Used ONLY when IS_PREVIEW === true
 * Matches the expected API shape for future backend integration
 */

// Athlete type for coach's assigned athletes
// Matches backend response from GET /api/coach/athletes
export interface CoachAthlete {
  id: string;
  name: string;
  email?: string;
  avatar_url?: string;
  avatar_initials?: string; // Optional initials from backend (e.g., "JD" for "John Doe")
  last_activity_date?: string;
}

export interface CoachDashboardData {
  adherence_pct: number;
  adherence_trend: number[];
  load_trend: 'stable' | 'increasing' | 'decreasing';
  risk_level: 'low' | 'medium' | 'high';
  risks: Array<{
    type: 'success' | 'warning' | 'info';
    message: string;
  }>;
  weekly_loads: Array<{
    week: string;
    level: 'low' | 'medium' | 'high';
    value: number;
  }>;
}

// Mock athletes for preview mode
export const mockCoachAthletes: CoachAthlete[] = [
  { id: 'athlete-1', name: 'John D.', email: 'john.d@example.com', last_activity_date: '2026-01-09' },
  { id: 'athlete-2', name: 'Sarah M.', email: 'sarah.m@example.com', last_activity_date: '2026-01-08' },
  { id: 'athlete-3', name: 'Mike R.', email: 'mike.r@example.com', last_activity_date: '2026-01-10' },
  { id: 'athlete-4', name: 'Emily K.', email: 'emily.k@example.com', last_activity_date: '2026-01-07' },
];

// Mock dashboard data per athlete (keyed by athlete id)
export const mockAthleteDashboardData: Record<string, CoachDashboardData> = {
  'athlete-1': {
    adherence_pct: 82,
    adherence_trend: [90, 85, 80, 70, 75, 78, 72, 80, 85, 88, 82, 79, 84, 82],
    load_trend: 'stable',
    risk_level: 'low',
    risks: [
      { type: 'success', message: 'No missed long runs' },
      { type: 'warning', message: '2 intensity sessions back-to-back' },
      { type: 'info', message: 'Recovery trending stable' },
    ],
    weekly_loads: [
      { week: 'Week -2', level: 'medium', value: 65 },
      { week: 'Week -1', level: 'high', value: 85 },
      { week: 'Current', level: 'medium', value: 70 },
    ],
  },
  'athlete-2': {
    adherence_pct: 95,
    adherence_trend: [92, 94, 96, 95, 93, 97, 94, 96, 95, 98, 94, 93, 95, 95],
    load_trend: 'increasing',
    risk_level: 'low',
    risks: [
      { type: 'success', message: 'Excellent adherence streak' },
      { type: 'info', message: 'Load building as planned' },
    ],
    weekly_loads: [
      { week: 'Week -2', level: 'medium', value: 60 },
      { week: 'Week -1', level: 'medium', value: 72 },
      { week: 'Current', level: 'high', value: 85 },
    ],
  },
  'athlete-3': {
    adherence_pct: 58,
    adherence_trend: [70, 65, 55, 50, 45, 60, 55, 62, 58, 55, 60, 52, 58, 58],
    load_trend: 'decreasing',
    risk_level: 'high',
    risks: [
      { type: 'warning', message: 'Missed 3 sessions this week' },
      { type: 'warning', message: 'Adherence below target' },
      { type: 'info', message: 'Consider athlete check-in' },
    ],
    weekly_loads: [
      { week: 'Week -2', level: 'high', value: 80 },
      { week: 'Week -1', level: 'medium', value: 55 },
      { week: 'Current', level: 'low', value: 35 },
    ],
  },
  'athlete-4': {
    adherence_pct: 74,
    adherence_trend: [80, 75, 72, 78, 70, 68, 75, 72, 76, 74, 71, 73, 75, 74],
    load_trend: 'stable',
    risk_level: 'medium',
    risks: [
      { type: 'warning', message: 'Skipped recovery sessions' },
      { type: 'info', message: 'Intensity distribution slightly high' },
    ],
    weekly_loads: [
      { week: 'Week -2', level: 'medium', value: 68 },
      { week: 'Week -1', level: 'medium', value: 70 },
      { week: 'Current', level: 'medium', value: 65 },
    ],
  },
};

// Default mock data (for backward compatibility)
export const mockCoachDashboardData: CoachDashboardData = mockAthleteDashboardData['athlete-1'];
