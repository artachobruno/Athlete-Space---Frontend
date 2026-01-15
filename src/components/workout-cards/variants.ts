/**
 * Workout Card Variants
 * 
 * Color themes and configuration for each card variant.
 */

import type { WorkoutCardVariant } from './types';

export interface CardTheme {
  bg: string;
  accent: string;
  sparkline: boolean;
  showPace: boolean;
}

export const CARD_THEMES: Record<WorkoutCardVariant, CardTheme> = {
  'completed-running': {
    bg: 'hsl(220 45% 20%)',
    accent: '#D6E2FF',
    sparkline: true,
    showPace: true,
  },
  'planned-running': {
    bg: 'hsl(145 45% 22%)',
    accent: '#CFF5D8',
    sparkline: false,
    showPace: false,
  },
  'completed-cycling': {
    bg: 'hsl(220 45% 20%)',
    accent: '#D6E2FF',
    sparkline: true,
    showPace: false,
  },
  'planned-cycling': {
    bg: 'hsl(145 45% 22%)',
    accent: '#CFF5D8',
    sparkline: false,
    showPace: false,
  },
  'completed-swimming': {
    bg: 'hsl(220 45% 20%)',
    accent: '#D6E2FF',
    sparkline: true,
    showPace: false,
  },
  'planned-swimming': {
    bg: 'hsl(145 45% 22%)',
    accent: '#CFF5D8',
    sparkline: false,
    showPace: false,
  },
  'strength': {
    bg: 'hsl(270 45% 24%)',
    accent: '#E6D8FF',
    sparkline: false,
    showPace: false,
  },
};
