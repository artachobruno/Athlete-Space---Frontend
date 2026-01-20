import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { StructuredWorkoutStep } from '@/api/workouts';

interface WorkoutStepsBarProps {
  steps: StructuredWorkoutStep[];
  className?: string;
}

// Map step types to colors
const STEP_COLORS: Record<string, string> = {
  warmup: 'bg-green-500/60',
  warm_up: 'bg-green-500/60',
  'warm-up': 'bg-green-500/60',
  cooldown: 'bg-blue-500/60',
  cool_down: 'bg-blue-500/60',
  'cool-down': 'bg-blue-500/60',
  recovery: 'bg-emerald-500/40',
  rest: 'bg-muted',
  interval: 'bg-red-500/70',
  work: 'bg-amber-500/70',
  tempo: 'bg-orange-500/70',
  threshold: 'bg-orange-600/70',
  steady: 'bg-primary/60',
  easy: 'bg-green-400/50',
  main: 'bg-primary/70',
};

function getStepColor(step: StructuredWorkoutStep): string {
  const type = (step.step_type || step.type || step.kind || '').toLowerCase();
  const intensity = (step.intensity || '').toLowerCase();
  
  // Check intensity first
  if (intensity.includes('recovery') || intensity.includes('easy')) {
    return STEP_COLORS.recovery;
  }
  if (intensity.includes('threshold') || intensity.includes('tempo')) {
    return STEP_COLORS.threshold;
  }
  if (intensity.includes('hard') || intensity.includes('interval')) {
    return STEP_COLORS.interval;
  }
  
  // Check type
  for (const [key, color] of Object.entries(STEP_COLORS)) {
    if (type.includes(key)) {
      return color;
    }
  }
  
  return 'bg-primary/50';
}

export function WorkoutStepsBar({ steps, className }: WorkoutStepsBarProps) {
  const sortedSteps = useMemo(() => {
    return [...steps].sort((a, b) => a.order - b.order);
  }, [steps]);

  const totalDuration = useMemo(() => {
    return sortedSteps.reduce((sum, step) => sum + (step.duration_seconds || 0), 0);
  }, [sortedSteps]);

  if (steps.length === 0 || totalDuration === 0) {
    return null;
  }

  return (
    <div className={cn('flex h-3 w-full rounded-full overflow-hidden bg-muted/30', className)}>
      {sortedSteps.map((step, index) => {
        const duration = step.duration_seconds || 0;
        const widthPercent = (duration / totalDuration) * 100;
        
        if (widthPercent < 0.5) return null; // Skip tiny segments
        
        return (
          <div
            key={step.id || index}
            className={cn(
              'h-full transition-all',
              getStepColor(step),
              index > 0 && 'border-l border-background/20'
            )}
            style={{ width: `${widthPercent}%` }}
            title={`${step.name || step.type}: ${Math.round(duration / 60)}min`}
          />
        );
      })}
    </div>
  );
}

/**
 * Simple bar for when we don't have structured steps - shows intensity zones
 */
interface SimpleWorkoutBarProps {
  intensity: string;
  durationMinutes: number;
  className?: string;
}

const INTENSITY_PATTERNS: Record<string, { colors: string[]; widths: number[] }> = {
  recovery: {
    colors: ['bg-green-500/50', 'bg-green-400/40', 'bg-green-500/50'],
    widths: [15, 70, 15],
  },
  easy: {
    colors: ['bg-green-500/50', 'bg-emerald-500/50', 'bg-green-500/50'],
    widths: [10, 80, 10],
  },
  aerobic: {
    colors: ['bg-green-500/50', 'bg-primary/60', 'bg-green-500/50'],
    widths: [15, 70, 15],
  },
  moderate: {
    colors: ['bg-green-500/50', 'bg-primary/60', 'bg-amber-500/60', 'bg-primary/60', 'bg-green-500/50'],
    widths: [10, 25, 30, 25, 10],
  },
  threshold: {
    colors: ['bg-green-500/50', 'bg-primary/60', 'bg-orange-500/70', 'bg-primary/60', 'bg-blue-500/50'],
    widths: [10, 15, 50, 15, 10],
  },
  tempo: {
    colors: ['bg-green-500/50', 'bg-orange-500/70', 'bg-green-500/50'],
    widths: [15, 70, 15],
  },
  interval: {
    colors: ['bg-green-500/50', 'bg-red-500/70', 'bg-amber-400/40', 'bg-red-500/70', 'bg-amber-400/40', 'bg-red-500/70', 'bg-blue-500/50'],
    widths: [10, 15, 10, 15, 10, 15, 25],
  },
  vo2: {
    colors: ['bg-green-500/50', 'bg-red-500/80', 'bg-emerald-400/40', 'bg-red-500/80', 'bg-emerald-400/40', 'bg-red-500/80', 'bg-blue-500/50'],
    widths: [10, 12, 8, 12, 8, 12, 38],
  },
  endurance: {
    colors: ['bg-green-500/50', 'bg-primary/60', 'bg-blue-500/50'],
    widths: [10, 80, 10],
  },
  long: {
    colors: ['bg-green-500/50', 'bg-primary/50', 'bg-blue-500/50'],
    widths: [8, 84, 8],
  },
};

export function SimpleWorkoutBar({ intensity, durationMinutes, className }: SimpleWorkoutBarProps) {
  const pattern = useMemo(() => {
    const lower = intensity.toLowerCase();
    for (const [key, value] of Object.entries(INTENSITY_PATTERNS)) {
      if (lower.includes(key)) {
        return value;
      }
    }
    return INTENSITY_PATTERNS.aerobic;
  }, [intensity]);

  return (
    <div className={cn('flex h-3 w-full rounded-full overflow-hidden bg-muted/30', className)}>
      {pattern.colors.map((color, index) => (
        <div
          key={index}
          className={cn('h-full', color)}
          style={{ width: `${pattern.widths[index]}%` }}
        />
      ))}
    </div>
  );
}
