/**
 * Canonical Coach Vocabulary
 * 
 * This is the shared language layer that sits between internal logic
 * and presentation. It provides deterministic, coach-written workout
 * names that are used consistently across:
 * 
 * - UI card titles
 * - Weekly narrative text
 * - Modal narrative blocks
 * - LLM coach responses (as a consumer)
 * 
 * Rules:
 * - No emojis
 * - No jokes
 * - No hype words
 * - Coach-written tone only
 * - Deterministic (same input = same output)
 * 
 * The LLM coach consumes this vocabulary but never generates it.
 * This ensures tone consistency and prevents language drift.
 */
import type { CoachVocabularyLevel } from '@/types/vocabulary';
import type { CalendarSport, CalendarIntent } from '@/types/calendar';

export const workoutDisplayNames: Record<
  CalendarSport,
  Partial<Record<CalendarIntent, Record<CoachVocabularyLevel, string>>>
> = {
  run: {
    easy: {
      foundational: 'Easy Aerobic Run',
      intermediate: 'Aerobic Maintenance Run',
      advanced: 'Aerobic Capacity Maintenance',
    },
    steady: {
      foundational: 'Steady Endurance Run',
      intermediate: 'Aerobic Durability Run',
      advanced: 'Aerobic Base Development',
    },
    tempo: {
      foundational: 'Steady Pace Run',
      intermediate: 'Controlled Tempo Session',
      advanced: 'Lactate Threshold Tempo',
    },
    intervals: {
      foundational: 'Speed Intervals',
      intermediate: 'Interval Session',
      advanced: 'VO₂max Intervals',
    },
    long: {
      foundational: 'Long Endurance Run',
      intermediate: 'Aerobic Durability Run',
      advanced: 'Marathon-Specific Endurance',
    },
    rest: {
      foundational: 'Rest Day',
      intermediate: 'Recovery Day',
      advanced: 'Adaptation Day',
    },
  },
  ride: {
    easy: {
      foundational: 'Easy Aerobic Ride',
      intermediate: 'Aerobic Maintenance Ride',
      advanced: 'Aerobic Capacity Maintenance',
    },
    steady: {
      foundational: 'Steady Endurance Ride',
      intermediate: 'Aerobic Durability Ride',
      advanced: 'Aerobic Base Development',
    },
    tempo: {
      foundational: 'Steady Pace Ride',
      intermediate: 'Controlled Tempo Session',
      advanced: 'Lactate Threshold Tempo',
    },
    intervals: {
      foundational: 'Speed Intervals',
      intermediate: 'Interval Session',
      advanced: 'VO₂max Intervals',
    },
    long: {
      foundational: 'Long Endurance Ride',
      intermediate: 'Aerobic Durability Ride',
      advanced: 'Endurance Base Development',
    },
    rest: {
      foundational: 'Rest Day',
      intermediate: 'Recovery Day',
      advanced: 'Adaptation Day',
    },
  },
  swim: {
    easy: {
      foundational: 'Easy Aerobic Swim',
      intermediate: 'Aerobic Maintenance Swim',
      advanced: 'Aerobic Capacity Maintenance',
    },
    steady: {
      foundational: 'Steady Endurance Swim',
      intermediate: 'Aerobic Durability Swim',
      advanced: 'Aerobic Base Development',
    },
    tempo: {
      foundational: 'Steady Pace Swim',
      intermediate: 'Controlled Tempo Session',
      advanced: 'Lactate Threshold Tempo',
    },
    intervals: {
      foundational: 'Speed Intervals',
      intermediate: 'Interval Session',
      advanced: 'VO₂max Intervals',
    },
    long: {
      foundational: 'Long Endurance Swim',
      intermediate: 'Aerobic Durability Swim',
      advanced: 'Endurance Base Development',
    },
    rest: {
      foundational: 'Rest Day',
      intermediate: 'Recovery Day',
      advanced: 'Adaptation Day',
    },
  },
  strength: {
    easy: {
      foundational: 'Light Strength',
      intermediate: 'Maintenance Strength',
      advanced: 'Recovery Strength',
    },
    steady: {
      foundational: 'Moderate Strength',
      intermediate: 'Base Strength',
      advanced: 'Foundation Strength',
    },
    tempo: {
      foundational: 'Strength Session',
      intermediate: 'Strength Workout',
      advanced: 'Strength Development',
    },
    intervals: {
      foundational: 'Circuit Training',
      intermediate: 'Interval Strength',
      advanced: 'Power Development',
    },
    long: {
      foundational: 'Extended Strength',
      intermediate: 'Durability Strength',
      advanced: 'Volume Strength',
    },
    rest: {
      foundational: 'Rest Day',
      intermediate: 'Recovery Day',
      advanced: 'Adaptation Day',
    },
  },
  race: {
    easy: {
      foundational: 'Easy Recovery',
      intermediate: 'Recovery Run',
      advanced: 'Active Recovery',
    },
    steady: {
      foundational: 'Race Preparation',
      intermediate: 'Race Taper',
      advanced: 'Race-Specific Preparation',
    },
    tempo: {
      foundational: 'Race Pace Practice',
      intermediate: 'Race Pace Session',
      advanced: 'Race-Specific Tempo',
    },
    intervals: {
      foundational: 'Race Intervals',
      intermediate: 'Race-Specific Intervals',
      advanced: 'Competition Intervals',
    },
    long: {
      foundational: 'Race Simulation',
      intermediate: 'Race-Specific Endurance',
      advanced: 'Competition Preparation',
    },
    rest: {
      foundational: 'Rest Day',
      intermediate: 'Recovery Day',
      advanced: 'Adaptation Day',
    },
  },
  other: {
    easy: {
      foundational: 'Easy Activity',
      intermediate: 'Maintenance Activity',
      advanced: 'Recovery Activity',
    },
    steady: {
      foundational: 'Steady Activity',
      intermediate: 'Base Activity',
      advanced: 'Foundation Activity',
    },
    tempo: {
      foundational: 'Moderate Activity',
      intermediate: 'Tempo Activity',
      advanced: 'Threshold Activity',
    },
    intervals: {
      foundational: 'Interval Activity',
      intermediate: 'Interval Session',
      advanced: 'High-Intensity Activity',
    },
    long: {
      foundational: 'Long Activity',
      intermediate: 'Extended Activity',
      advanced: 'Endurance Activity',
    },
    rest: {
      foundational: 'Rest Day',
      intermediate: 'Recovery Day',
      advanced: 'Adaptation Day',
    },
  },
};
