/**
 * Mock data for Coach Dashboard
 * Used ONLY when IS_PREVIEW === true
 * Matches the expected API shape for future backend integration
 */

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

export const mockCoachDashboardData: CoachDashboardData = {
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
};
