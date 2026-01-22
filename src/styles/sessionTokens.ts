/**
 * Phase 4: Session Card Design Tokens
 * 
 * Unified design tokens for session cards across all surfaces.
 * Based on Training Plan style as visual baseline.
 */

// Spacing tokens
export const sessionSpacing = {
  compact: {
    padding: 'p-2',
    gap: 'gap-1.5',
    titleSize: 'text-sm',
    metadataSize: 'text-xs',
  },
  standard: {
    padding: 'p-3',
    gap: 'gap-2',
    titleSize: 'text-base',
    metadataSize: 'text-sm',
  },
  rich: {
    padding: 'p-4',
    gap: 'gap-3',
    titleSize: 'text-lg',
    metadataSize: 'text-sm',
  },
} as const;

// Border radius
export const sessionRadius = {
  compact: 'rounded-md',
  standard: 'rounded-lg',
  rich: 'rounded-lg',
} as const;

// Status colors
export const sessionStatusColors = {
  planned: {
    border: 'border-border',
    background: 'bg-card',
    text: 'text-foreground',
    badge: 'bg-muted text-muted-foreground border-border',
  },
  completed: {
    border: 'border-load-fresh/30',
    background: 'bg-card',
    text: 'text-foreground',
    badge: 'bg-load-fresh/10 text-load-fresh border-load-fresh/30',
  },
  skipped: {
    border: 'border-muted-foreground/30',
    background: 'bg-muted/20',
    text: 'text-muted-foreground',
    badge: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  },
  deleted: {
    border: 'border-destructive/20',
    background: 'bg-muted/10',
    text: 'text-muted-foreground',
    badge: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30',
  },
  missed: {
    border: 'border-destructive/30',
    background: 'bg-card',
    text: 'text-muted-foreground',
    badge: 'bg-destructive/10 text-destructive border-destructive/30',
  },
} as const;

// Intent/Intensity colors (for badges and accents)
export const sessionIntentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
  easy: 'bg-load-fresh/15 text-load-fresh border-load-fresh/30',
  tempo: 'bg-accent/15 text-accent border-accent/30',
  long: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
  rest: 'bg-muted text-muted-foreground border-border',
} as const;

// Font sizes
export const sessionFontSizes = {
  compact: {
    title: 'text-sm',
    metadata: 'text-xs',
    badge: 'text-[10px]',
  },
  standard: {
    title: 'text-base',
    metadata: 'text-sm',
    badge: 'text-xs',
  },
  rich: {
    title: 'text-lg',
    metadata: 'text-sm',
    badge: 'text-xs',
  },
} as const;
