/**
 * Phase 4.5: Session Card Design Tokens
 * 
 * Unified design tokens for session cards across all surfaces.
 * Aligned to Lovable mockups for consistent spacing, hierarchy, and density.
 */

// Spacing tokens - padding (x/y), gaps between elements
export const sessionSpacing = {
  compact: {
    padding: 'px-2 py-1.5',
    gap: 'gap-1',
    titleGap: 'gap-1.5',
    metadataGap: 'gap-2',
  },
  standard: {
    padding: 'px-3 py-2.5',
    gap: 'gap-2',
    titleGap: 'gap-2',
    metadataGap: 'gap-3',
  },
  rich: {
    padding: 'px-4 py-3',
    gap: 'gap-3',
    titleGap: 'gap-2.5',
    metadataGap: 'gap-3',
  },
} as const;

// Border radius per density
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

// Font sizes per density
export const sessionFontSizes = {
  compact: {
    title: 'text-sm',
    metadata: 'text-[11px]',
    badge: 'text-[10px]',
    insight: 'text-[10px]',
  },
  standard: {
    title: 'text-base',
    metadata: 'text-sm',
    badge: 'text-xs',
    insight: 'text-xs',
  },
  rich: {
    title: 'text-lg',
    metadata: 'text-sm',
    badge: 'text-xs',
    insight: 'text-sm',
  },
} as const;
