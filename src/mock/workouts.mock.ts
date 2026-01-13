import type { Workout } from '@/types/workout';
import type { WorkoutTimeline, WorkoutTimelineSegment, WorkoutStreams } from '@/types/workoutTimeline';

/**
 * Mock workouts (canonical) for preview mode.
 * These are the canonical workout definitions with steps.
 */
export const mockWorkouts: Workout[] = [
  {
    id: 'mock-workout-1',
    sport: 'running',
    source: 'mock',
    total_duration_seconds: 45 * 60, // 45 minutes
    total_distance_meters: 8200, // 8.2 km
    steps: [
      {
        id: 'step-1-1',
        order: 1,
        type: 'warmup',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'hr',
        target_min: 120,
        target_max: 140,
        instructions: 'Easy jog to warm up',
        purpose: 'Prepare body for main effort',
        inferred: false,
      },
      {
        id: 'step-1-2',
        order: 2,
        type: 'main',
        duration_seconds: 35 * 60, // 35 min
        target_metric: 'hr',
        target_min: 140,
        target_max: 150,
        instructions: 'Steady Zone 2 effort',
        purpose: 'Aerobic base building',
        inferred: false,
      },
      {
        id: 'step-1-3',
        order: 3,
        type: 'cooldown',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'hr',
        target_min: 120,
        target_max: 140,
        instructions: 'Easy jog to cool down',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-2',
    sport: 'cycling',
    source: 'mock',
    total_duration_seconds: 75 * 60, // 75 minutes
    total_distance_meters: 42000, // 42 km
    steps: [
      {
        id: 'step-2-1',
        order: 1,
        type: 'warmup',
        duration_seconds: 15 * 60, // 15 min
        target_metric: 'power',
        target_min: 150,
        target_max: 200,
        instructions: 'Progressive warmup',
        purpose: 'Prepare for intervals',
        inferred: false,
      },
      {
        id: 'step-2-2',
        order: 2,
        type: 'interval',
        duration_seconds: 12 * 60, // 12 min
        target_metric: 'power',
        target_min: 240,
        target_max: 250,
        instructions: 'Sweet spot interval (88-93% FTP)',
        purpose: 'Threshold development',
        inferred: false,
      },
      {
        id: 'step-2-3',
        order: 3,
        type: 'recovery',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 100,
        target_max: 150,
        instructions: 'Easy spin recovery',
        purpose: 'Active recovery between intervals',
        inferred: false,
      },
      {
        id: 'step-2-4',
        order: 4,
        type: 'interval',
        duration_seconds: 12 * 60, // 12 min
        target_metric: 'power',
        target_min: 240,
        target_max: 250,
        instructions: 'Sweet spot interval (88-93% FTP)',
        purpose: 'Threshold development',
        inferred: false,
      },
      {
        id: 'step-2-5',
        order: 5,
        type: 'recovery',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 100,
        target_max: 150,
        instructions: 'Easy spin recovery',
        purpose: 'Active recovery between intervals',
        inferred: false,
      },
      {
        id: 'step-2-6',
        order: 6,
        type: 'interval',
        duration_seconds: 12 * 60, // 12 min
        target_metric: 'power',
        target_min: 240,
        target_max: 250,
        instructions: 'Sweet spot interval (88-93% FTP)',
        purpose: 'Threshold development',
        inferred: false,
      },
      {
        id: 'step-2-7',
        order: 7,
        type: 'cooldown',
        duration_seconds: 14 * 60, // 14 min
        target_metric: 'power',
        target_min: 100,
        target_max: 150,
        instructions: 'Easy spin cooldown',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-3',
    sport: 'running',
    source: 'mock',
    total_duration_seconds: 55 * 60, // 55 minutes
    total_distance_meters: 10500, // 10.5 km
    steps: [
      {
        id: 'step-3-1',
        order: 1,
        type: 'warmup',
        duration_seconds: 15 * 60, // 15 min
        target_metric: 'pace',
        target_min: 5.5,
        target_max: 6.0,
        instructions: 'Progressive warmup with strides',
        purpose: 'Prepare for threshold work',
        inferred: false,
      },
      {
        id: 'step-3-2',
        order: 2,
        type: 'interval',
        duration_seconds: 3 * 60, // 3 min
        target_metric: 'pace',
        target_min: 4.0,
        target_max: 4.2,
        instructions: 'Threshold pace interval',
        purpose: 'Lactate threshold development',
        inferred: false,
      },
      {
        id: 'step-3-3',
        order: 3,
        type: 'recovery',
        duration_seconds: 2 * 60, // 2 min
        target_metric: 'pace',
        target_min: 6.0,
        target_max: 6.5,
        instructions: 'Easy jog recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-3-4',
        order: 4,
        type: 'interval',
        duration_seconds: 3 * 60, // 3 min
        target_metric: 'pace',
        target_min: 4.0,
        target_max: 4.2,
        instructions: 'Threshold pace interval',
        purpose: 'Lactate threshold development',
        inferred: false,
      },
      {
        id: 'step-3-5',
        order: 5,
        type: 'recovery',
        duration_seconds: 2 * 60, // 2 min
        target_metric: 'pace',
        target_min: 6.0,
        target_max: 6.5,
        instructions: 'Easy jog recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-3-6',
        order: 6,
        type: 'interval',
        duration_seconds: 3 * 60, // 3 min
        target_metric: 'pace',
        target_min: 4.0,
        target_max: 4.2,
        instructions: 'Threshold pace interval',
        purpose: 'Lactate threshold development',
        inferred: false,
      },
      {
        id: 'step-3-7',
        order: 7,
        type: 'cooldown',
        duration_seconds: 10 * 60, // 10 min
        target_metric: 'pace',
        target_min: 5.5,
        target_max: 6.0,
        instructions: 'Easy jog cooldown',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-4',
    sport: 'running',
    source: 'mock',
    total_duration_seconds: 95 * 60, // 95 minutes
    total_distance_meters: 18200, // 18.2 km
    steps: [
      {
        id: 'step-4-1',
        order: 1,
        type: 'main',
        duration_seconds: 95 * 60, // 95 min
        target_metric: 'hr',
        target_min: 145,
        target_max: 155,
        instructions: 'Steady long run in Zone 2',
        purpose: 'Aerobic endurance building',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-5',
    sport: 'cycling',
    source: 'mock',
    total_duration_seconds: 40 * 60, // 40 minutes
    total_distance_meters: 22000, // 22 km
    steps: [
      {
        id: 'step-5-1',
        order: 1,
        type: 'main',
        duration_seconds: 40 * 60, // 40 min
        target_metric: 'power',
        target_min: 120,
        target_max: 150,
        instructions: 'Very easy recovery spin',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-6',
    sport: 'swimming',
    source: 'mock',
    total_duration_seconds: 50 * 60, // 50 minutes
    total_distance_meters: 2000, // 2.0 km
    steps: [
      {
        id: 'step-6-1',
        order: 1,
        type: 'warmup',
        duration_seconds: 10 * 60, // 10 min
        instructions: 'Easy swim warmup',
        purpose: 'Prepare for technique work',
        inferred: false,
      },
      {
        id: 'step-6-2',
        order: 2,
        type: 'main',
        duration_seconds: 30 * 60, // 30 min
        instructions: 'Technique focus - catch and rotation',
        purpose: 'Improve stroke efficiency',
        inferred: false,
      },
      {
        id: 'step-6-3',
        order: 3,
        type: 'cooldown',
        duration_seconds: 10 * 60, // 10 min
        instructions: 'Easy swim cooldown',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-7',
    sport: 'running',
    source: 'mock',
    total_duration_seconds: 60 * 60, // 60 minutes
    total_distance_meters: 12000, // 12.0 km
    steps: [
      {
        id: 'step-7-1',
        order: 1,
        type: 'warmup',
        duration_seconds: 15 * 60, // 15 min
        target_metric: 'pace',
        target_min: 5.0,
        target_max: 5.5,
        instructions: 'Progressive warmup with strides',
        purpose: 'Prepare for VO2max work',
        inferred: false,
      },
      {
        id: 'step-7-2',
        order: 2,
        type: 'interval',
        duration_seconds: 90, // 90 sec (400m)
        target_metric: 'pace',
        target_min: 3.5,
        target_max: 3.8,
        instructions: '400m at 5K pace',
        purpose: 'VO2max development',
        inferred: false,
      },
      {
        id: 'step-7-3',
        order: 3,
        type: 'recovery',
        duration_seconds: 90, // 90 sec
        target_metric: 'pace',
        target_min: 6.0,
        target_max: 7.0,
        instructions: 'Easy jog recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-7-4',
        order: 4,
        type: 'interval',
        duration_seconds: 90, // 90 sec
        target_metric: 'pace',
        target_min: 3.5,
        target_max: 3.8,
        instructions: '400m at 5K pace',
        purpose: 'VO2max development',
        inferred: false,
      },
      {
        id: 'step-7-5',
        order: 5,
        type: 'recovery',
        duration_seconds: 90, // 90 sec
        target_metric: 'pace',
        target_min: 6.0,
        target_max: 7.0,
        instructions: 'Easy jog recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-7-6',
        order: 6,
        type: 'interval',
        duration_seconds: 90, // 90 sec
        target_metric: 'pace',
        target_min: 3.5,
        target_max: 3.8,
        instructions: '400m at 5K pace',
        purpose: 'VO2max development',
        inferred: false,
      },
      {
        id: 'step-7-7',
        order: 7,
        type: 'recovery',
        duration_seconds: 90, // 90 sec
        target_metric: 'pace',
        target_min: 6.0,
        target_max: 7.0,
        instructions: 'Easy jog recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-7-8',
        order: 8,
        type: 'interval',
        duration_seconds: 90, // 90 sec
        target_metric: 'pace',
        target_min: 3.5,
        target_max: 3.8,
        instructions: '400m at 5K pace',
        purpose: 'VO2max development',
        inferred: false,
      },
      {
        id: 'step-7-9',
        order: 9,
        type: 'cooldown',
        duration_seconds: 10 * 60, // 10 min
        target_metric: 'pace',
        target_min: 5.0,
        target_max: 6.0,
        instructions: 'Easy jog cooldown',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-8',
    sport: 'cycling',
    source: 'mock',
    total_duration_seconds: 90 * 60, // 90 minutes
    total_distance_meters: 38000, // 38 km
    steps: [
      {
        id: 'step-8-1',
        order: 1,
        type: 'warmup',
        duration_seconds: 15 * 60, // 15 min
        target_metric: 'power',
        target_min: 150,
        target_max: 200,
        instructions: 'Progressive warmup to threshold',
        purpose: 'Prepare for hill repeats',
        inferred: false,
      },
      {
        id: 'step-8-2',
        order: 2,
        type: 'interval',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 275,
        target_max: 285,
        instructions: 'Hill repeat at threshold power',
        purpose: 'Strength and threshold development',
        inferred: false,
      },
      {
        id: 'step-8-3',
        order: 3,
        type: 'recovery',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 100,
        target_max: 150,
        instructions: 'Easy spin recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-8-4',
        order: 4,
        type: 'interval',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 275,
        target_max: 285,
        instructions: 'Hill repeat at threshold power',
        purpose: 'Strength and threshold development',
        inferred: false,
      },
      {
        id: 'step-8-5',
        order: 5,
        type: 'recovery',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 100,
        target_max: 150,
        instructions: 'Easy spin recovery',
        purpose: 'Active recovery',
        inferred: false,
      },
      {
        id: 'step-8-6',
        order: 6,
        type: 'interval',
        duration_seconds: 5 * 60, // 5 min
        target_metric: 'power',
        target_min: 275,
        target_max: 285,
        instructions: 'Hill repeat at threshold power',
        purpose: 'Strength and threshold development',
        inferred: false,
      },
      {
        id: 'step-8-7',
        order: 7,
        type: 'cooldown',
        duration_seconds: 15 * 60, // 15 min
        target_metric: 'power',
        target_min: 100,
        target_max: 150,
        instructions: 'Easy spin cooldown',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-9',
    sport: 'running',
    source: 'mock',
    total_duration_seconds: 35 * 60, // 35 minutes
    total_distance_meters: 6500, // 6.5 km
    steps: [
      {
        id: 'step-9-1',
        order: 1,
        type: 'main',
        duration_seconds: 35 * 60, // 35 min
        target_metric: 'hr',
        target_min: 130,
        target_max: 140,
        instructions: 'Very easy recovery run',
        purpose: 'Active recovery',
        inferred: false,
      },
    ],
  },
  {
    id: 'mock-workout-10',
    sport: 'triathlon',
    source: 'mock',
    total_duration_seconds: 120 * 60, // 120 minutes
    total_distance_meters: 50000, // 50 km
    steps: [
      {
        id: 'step-10-1',
        order: 1,
        type: 'main',
        duration_seconds: 60 * 60, // 60 min bike
        target_metric: 'power',
        target_min: 200,
        target_max: 230,
        instructions: 'Steady bike effort',
        purpose: 'Bike fitness',
        inferred: false,
      },
      {
        id: 'step-10-2',
        order: 2,
        type: 'main',
        duration_seconds: 20 * 60, // 20 min run
        target_metric: 'pace',
        target_min: 4.5,
        target_max: 5.0,
        instructions: 'Transition run off the bike',
        purpose: 'Brick training for race simulation',
        inferred: false,
      },
    ],
  },
];

/**
 * Generates a metric value with realistic noise.
 * Returns null if min/max are not provided.
 */
function generateMetricValue(
  min?: number,
  max?: number
): number | null {
  if (min == null || max == null) return null;

  const noise = 0.85 + Math.random() * 0.3;
  return Math.round((min + (max - min) * noise) * 10) / 10;
}

/**
 * Builds mock stream data aligned with workout segments.
 * Generates time-aligned arrays with 5-second intervals.
 */
function buildMockStreams(
  workout: Workout,
  segments: WorkoutTimelineSegment[]
): WorkoutStreams {
  const time: number[] = [];
  const hr: (number | null)[] = [];
  const pace: (number | null)[] = [];
  const power: (number | null)[] = [];

  for (let t = 0; t <= workout.total_duration_seconds!; t += 5) {
    time.push(t);

    const segment = segments.find(
      s => s.start_second <= t && s.end_second > t
    );

    if (!segment || !segment.target.metric) {
      hr.push(null);
      pace.push(null);
      power.push(null);
      continue;
    }

    const value = generateMetricValue(
      segment.target.min,
      segment.target.max
    );

    hr.push(segment.target.metric === 'hr' ? value : null);
    pace.push(segment.target.metric === 'pace' ? value : null);
    power.push(segment.target.metric === 'power' ? value : null);
  }

  return { time, hr, pace, power };
}

/**
 * Builds a mock timeline from a workout.
 * Creates segments from workout steps with compliance data.
 */
export function buildTimelineFromMockWorkout(workoutId: string): WorkoutTimeline | null {
  const workout = mockWorkouts.find(w => w.id === workoutId);
  if (!workout) {
    return null;
  }

  let currentSecond = 0;
  const segments: WorkoutTimelineSegment[] = workout.steps.map((step, index) => {
    const duration = step.duration_seconds || 0;
    const segment: WorkoutTimelineSegment = {
      step_id: step.id,
      order: step.order,
      step_type: step.type,
      start_second: currentSecond,
      end_second: currentSecond + duration,
      target: {
        metric: step.target_metric,
        min: step.target_min,
        max: step.target_max,
        value: step.target_value,
      },
      purpose: step.purpose,
      compliance_percent: 85 + Math.random() * 10, // Mock compliance between 85-95%
      coach_feedback: `Good execution of ${step.type} phase.`,
      coach_tip: step.instructions,
    };
    currentSecond += duration;
    return segment;
  });

  // Generate some mock actual data points
  const actualData: Array<{ time_second: number; value: number }> = [];
  for (let i = 0; i < workout.total_duration_seconds!; i += 30) {
    // Add data point every 30 seconds
    const segment = segments.find(s => s.start_second <= i && s.end_second > i);
    if (segment && segment.target.metric) {
      const targetMin = segment.target.min || 0;
      const targetMax = segment.target.max || targetMin + 50;
      const value = targetMin + (targetMax - targetMin) * (0.8 + Math.random() * 0.2); // 80-100% of target range
      actualData.push({ time_second: i, value: Math.round(value * 10) / 10 });
    }
  }

  const streams = buildMockStreams(workout, segments);

  return {
    workout_id: workoutId,
    total_duration_seconds: workout.total_duration_seconds || 0,
    segments,
    streams,
    overall_compliance_percent: 88,
    total_paused_seconds: 0,
    actual_data: actualData.length > 0 ? actualData : undefined,
    coach_verdict: 'Good execution overall. Maintained target zones well.',
    coach_summary: 'Workout completed as planned with good compliance across all phases.',
    llm_confidence: 0.92,
  };
}
