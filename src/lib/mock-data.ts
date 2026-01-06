// MOCK DATA - FORMAT REFERENCE ONLY
// This file is kept as a reference for data structure/format
// All components now use API functions instead of this mock data
// DO NOT IMPORT OR USE THIS FILE IN COMPONENTS
import type { CompletedActivity, TrainingLoad, PlannedWorkout, WeeklyPlan } from '@/types';
import { format, subDays, addDays, startOfWeek, endOfWeek } from 'date-fns';

const today = new Date();

export const mockActivities: CompletedActivity[] = [
  {
    id: '1',
    date: format(subDays(today, 1), 'yyyy-MM-dd'),
    sport: 'running',
    title: 'Morning Easy Run',
    duration: 45,
    distance: 8.2,
    avgPace: '5:29/km',
    avgHeartRate: 142,
    elevation: 85,
    trainingLoad: 55,
    source: 'strava',
    coachFeedback: 'Good easy effort. Heart rate stayed in Zone 2 for 85% of the run. Nice negative split in the second half.',
  },
  {
    id: '2',
    date: format(subDays(today, 2), 'yyyy-MM-dd'),
    sport: 'cycling',
    title: 'Tempo Intervals',
    duration: 75,
    distance: 42,
    avgPace: '33.6 km/h',
    avgHeartRate: 158,
    avgPower: 245,
    elevation: 320,
    trainingLoad: 95,
    source: 'strava',
    coachFeedback: 'Strong tempo work. Power output was consistent across all intervals. Consider 2-3 more watts next session.',
  },
  {
    id: '3',
    date: format(subDays(today, 3), 'yyyy-MM-dd'),
    sport: 'running',
    title: 'Threshold Intervals',
    duration: 55,
    distance: 10.5,
    avgPace: '5:14/km',
    avgHeartRate: 165,
    elevation: 45,
    trainingLoad: 78,
    source: 'strava',
    coachFeedback: 'Executed the workout as planned. Recovery between intervals was adequate. You handled the cumulative fatigue well.',
  },
  {
    id: '4',
    date: format(subDays(today, 5), 'yyyy-MM-dd'),
    sport: 'running',
    title: 'Long Run',
    duration: 95,
    distance: 18.2,
    avgPace: '5:13/km',
    avgHeartRate: 148,
    elevation: 180,
    trainingLoad: 120,
    source: 'strava',
    coachFeedback: 'Excellent long run execution. Pacing was well controlled - you resisted the urge to go out too fast.',
  },
  {
    id: '5',
    date: format(subDays(today, 6), 'yyyy-MM-dd'),
    sport: 'cycling',
    title: 'Recovery Spin',
    duration: 40,
    distance: 22,
    avgPace: '33.0 km/h',
    avgHeartRate: 118,
    avgPower: 145,
    elevation: 65,
    trainingLoad: 25,
    source: 'strava',
  },
];

export const mockTrainingLoad: TrainingLoad[] = Array.from({ length: 42 }, (_, i) => {
  const date = subDays(today, 41 - i);
  const baseCtl = 45 + (i * 0.4);
  const dailyLoad = 40 + Math.random() * 80;
  const atl = 35 + (Math.random() * 30);
  const ctl = baseCtl + (Math.random() * 5 - 2.5);
  const tsb = ctl - atl;
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    atl: Math.round(atl * 10) / 10,
    ctl: Math.round(ctl * 10) / 10,
    tsb: Math.round(tsb * 10) / 10,
    dailyLoad: Math.round(dailyLoad),
  };
});

export const mockPlannedWorkouts: PlannedWorkout[] = [
  {
    id: 'p1',
    date: format(today, 'yyyy-MM-dd'),
    sport: 'running',
    intent: 'aerobic',
    title: 'Easy Run',
    description: 'Steady aerobic run at conversational pace. Focus on relaxed form and consistent effort.',
    duration: 50,
    distance: 9,
    structure: [
      { type: 'warmup', duration: 10, intensity: 'Very easy' },
      { type: 'main', duration: 35, intensity: 'Zone 2' },
      { type: 'cooldown', duration: 5, intensity: 'Very easy' },
    ],
    completed: false,
  },
  {
    id: 'p2',
    date: format(addDays(today, 1), 'yyyy-MM-dd'),
    sport: 'cycling',
    intent: 'threshold',
    title: 'Sweet Spot Intervals',
    description: '3x12 minutes at sweet spot power (88-93% FTP) with 5 minute recovery between.',
    duration: 75,
    distance: 45,
    structure: [
      { type: 'warmup', duration: 15, intensity: 'Progressive' },
      { type: 'interval', duration: 12, intensity: '88-93% FTP', notes: 'Sweet spot' },
      { type: 'recovery', duration: 5, intensity: 'Easy spin' },
      { type: 'interval', duration: 12, intensity: '88-93% FTP' },
      { type: 'recovery', duration: 5, intensity: 'Easy spin' },
      { type: 'interval', duration: 12, intensity: '88-93% FTP' },
      { type: 'cooldown', duration: 14, intensity: 'Easy spin' },
    ],
    completed: false,
  },
  {
    id: 'p3',
    date: format(addDays(today, 2), 'yyyy-MM-dd'),
    sport: 'running',
    intent: 'recovery',
    title: 'Recovery Jog',
    description: 'Very easy recovery run. Keep heart rate in Zone 1. Walk breaks are fine.',
    duration: 30,
    distance: 5,
    completed: false,
  },
  {
    id: 'p4',
    date: format(addDays(today, 3), 'yyyy-MM-dd'),
    sport: 'running',
    intent: 'vo2',
    title: 'VO2max Intervals',
    description: '5x3 minutes at 95-100% vVO2max with 3 minute recovery jog between.',
    duration: 55,
    distance: 11,
    structure: [
      { type: 'warmup', duration: 15, intensity: 'Progressive with strides' },
      { type: 'interval', duration: 3, intensity: '95-100% vVO2max' },
      { type: 'recovery', duration: 3, intensity: 'Easy jog' },
      { type: 'interval', duration: 3, intensity: '95-100% vVO2max' },
      { type: 'recovery', duration: 3, intensity: 'Easy jog' },
      { type: 'interval', duration: 3, intensity: '95-100% vVO2max' },
      { type: 'recovery', duration: 3, intensity: 'Easy jog' },
      { type: 'interval', duration: 3, intensity: '95-100% vVO2max' },
      { type: 'recovery', duration: 3, intensity: 'Easy jog' },
      { type: 'interval', duration: 3, intensity: '95-100% vVO2max' },
      { type: 'cooldown', duration: 10, intensity: 'Easy jog' },
    ],
    completed: false,
  },
  {
    id: 'p5',
    date: format(addDays(today, 4), 'yyyy-MM-dd'),
    sport: 'cycling',
    intent: 'aerobic',
    title: 'Endurance Ride',
    description: 'Steady endurance ride at moderate aerobic intensity. Good opportunity for some Zone 2 volume.',
    duration: 90,
    distance: 55,
    completed: false,
  },
  {
    id: 'p6',
    date: format(addDays(today, 5), 'yyyy-MM-dd'),
    sport: 'running',
    intent: 'endurance',
    title: 'Long Run',
    description: 'Build aerobic endurance with a controlled long run. Start conservatively, finish strong.',
    duration: 100,
    distance: 20,
    structure: [
      { type: 'main', duration: 100, intensity: 'Zone 2, last 20 min at marathon pace', notes: 'Fuel every 45 min' },
    ],
    completed: false,
  },
  {
    id: 'p7',
    date: format(addDays(today, 6), 'yyyy-MM-dd'),
    sport: 'running',
    intent: 'recovery',
    title: 'Rest or Easy Spin',
    description: 'Complete rest or very easy 30 minute spin/jog if feeling good.',
    duration: 0,
    completed: false,
  },
];

export const mockWeeklyPlan: WeeklyPlan = {
  weekStart: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  weekEnd: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
  plannedLoad: 450,
  actualLoad: 248,
  workouts: mockPlannedWorkouts,
  coachNotes: "This week builds on last week's foundation. The VO2max session on Thursday is the key workout - arrive fresh and execute the intervals with intent. The long run on Saturday includes some marathon-pace work in the final 20 minutes to practice running on tired legs.",
};

export function getCurrentLoadStatus(): { status: import('@/types').LoadStatus; tsb: number; description: string } {
  const latest = mockTrainingLoad[mockTrainingLoad.length - 1];
  const tsb = latest.tsb;
  
  if (tsb > 15) {
    return { status: 'fresh', tsb, description: 'Well rested - ready for hard training or racing' };
  } else if (tsb >= -10) {
    return { status: 'optimal', tsb, description: 'Good training balance - productive training zone' };
  } else if (tsb >= -25) {
    return { status: 'overreaching', tsb, description: 'Accumulating fatigue - monitor recovery' };
  } else {
    return { status: 'overtraining', tsb, description: 'High fatigue - prioritize rest' };
  }
}

export function getTodayDecision(): { decision: import('@/types').DailyDecision; reason: string } {
  const load = getCurrentLoadStatus();
  const todayWorkout = mockPlannedWorkouts.find(w => w.date === format(today, 'yyyy-MM-dd'));
  
  if (!todayWorkout) {
    return { decision: 'rest', reason: 'No workout scheduled for today. Use this time for recovery.' };
  }
  
  if (load.status === 'overtraining') {
    return { decision: 'rest', reason: 'Your fatigue levels are elevated. Skip today\'s workout and prioritize recovery.' };
  }
  
  if (load.status === 'overreaching' && todayWorkout.intent === 'vo2') {
    return { decision: 'modify', reason: 'With current fatigue, reduce today\'s intensity. Convert to a tempo session instead.' };
  }
  
  return { decision: 'proceed', reason: 'You\'re in good shape for today\'s planned workout. Execute as written.' };
}
