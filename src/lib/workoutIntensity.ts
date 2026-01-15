/**
 * Intensity color mapping for workout steps.
 * 
 * Provides consistent color coding across the app for workout step intensities.
 */

export type IntensityLevel = 
  | 'warmup' 
  | 'cooldown' 
  | 'easy' 
  | 'recovery' 
  | 'rest'
  | 'steady'
  | 'tempo'
  | 'lt2'
  | 'threshold'
  | 'vo2'
  | 'interval'
  | 'hard'
  | 'flow';

export interface IntensityColor {
  bg: string;
  text: string;
  border: string;
}

export const INTENSITY_COLORS: Record<string, IntensityColor> = {
  // Easy/Recovery (Green)
  warmup: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  cooldown: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  easy: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  recovery: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  rest: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  
  // Moderate (Yellow/Orange)
  steady: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  tempo: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  lt2: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  threshold: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  
  // Hard (Red)
  vo2: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  interval: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  hard: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  
  // Neutral (Blue)
  flow: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
};

/**
 * Get intensity color classes for a given intensity string.
 * 
 * @param intensity - Intensity string (case-insensitive)
 * @returns IntensityColor object with Tailwind classes
 */
export function getIntensityColor(intensity: string | null | undefined): IntensityColor {
  if (!intensity) {
    return {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700',
    };
  }
  
  const lower = intensity.toLowerCase();
  
  // Direct match
  if (INTENSITY_COLORS[lower]) {
    return INTENSITY_COLORS[lower];
  }
  
  // Partial match for common variations
  if (lower.includes('warmup') || lower.includes('warm')) {
    return INTENSITY_COLORS.warmup;
  }
  if (lower.includes('cooldown') || lower.includes('cool')) {
    return INTENSITY_COLORS.cooldown;
  }
  if (lower.includes('recovery') || lower.includes('rest')) {
    return INTENSITY_COLORS.recovery;
  }
  if (lower.includes('tempo') || lower.includes('lt2')) {
    return INTENSITY_COLORS.tempo;
  }
  if (lower.includes('threshold')) {
    return INTENSITY_COLORS.threshold;
  }
  if (lower.includes('vo2') || lower.includes('interval') || lower.includes('hard')) {
    return INTENSITY_COLORS.interval;
  }
  if (lower.includes('easy')) {
    return INTENSITY_COLORS.easy;
  }
  if (lower.includes('steady')) {
    return INTENSITY_COLORS.steady;
  }
  
  // Default fallback
  return {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  };
}
