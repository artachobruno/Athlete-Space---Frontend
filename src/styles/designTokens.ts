/* ===============================
   AthleteSpace Design Tokens
   F1 Telemetry Design System
   =============================== */

// Legacy glass tokens (deprecated - use f1 tokens)
export const glass = {
  card: "bg-white/12 backdrop-blur-md border border-white/20 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]",
};

// Legacy spacing (deprecated - use f1 tokens)
export const spacing = {
  page: "px-6 py-8",
  section: "py-16",
};

// Legacy typography (deprecated - use f1 tokens)
export const typography = {
  title: "text-xl font-semibold tracking-tight",
  subtitle: "text-sm text-muted-foreground",
};

/* ===============================
   F1 Design System Tokens
   =============================== */

/** F1 Surface classes for card variants */
export const f1Surface = {
  /** Standard glass surface - informational cards */
  glass: "f1-surface",
  /** Strong glass surface - primary focus panels */
  strong: "f1-surface-strong",
  /** Flat dark surface - background panels */
  flat: "f1-surface-flat",
  /** Actionable surface modifier */
  actionable: "f1-surface-actionable",
} as const;

/** F1 Typography classes */
export const f1Typography = {
  // Headlines
  headlineLg: "f1-headline f1-headline-lg",
  headlineMd: "f1-headline f1-headline-md",
  headlineSm: "f1-headline f1-headline-sm",
  // Metrics (monospace, tabular nums)
  metricLg: "f1-metric f1-metric-lg",
  metricMd: "f1-metric f1-metric-md",
  metricSm: "f1-metric f1-metric-sm",
  metricXs: "f1-metric f1-metric-xs",
  // Labels (uppercase, tracking)
  label: "f1-label",
  labelMd: "f1-label-md",
  // Body text
  body: "f1-body",
  bodySm: "f1-body-sm",
} as const;

/** F1 Status classes for semantic coloring */
export const f1Status = {
  // Text colors
  safe: "f1-status-safe",
  caution: "f1-status-caution",
  danger: "f1-status-danger",
  active: "f1-status-active",
  // Background + border
  safeBg: "f1-status-safe-bg",
  cautionBg: "f1-status-caution-bg",
  dangerBg: "f1-status-danger-bg",
  activeBg: "f1-status-active-bg",
  // Border only
  safeBorder: "f1-status-safe-border",
  cautionBorder: "f1-status-caution-border",
  dangerBorder: "f1-status-danger-border",
  activeBorder: "f1-status-active-border",
} as const;

/** F1 Glow classes for intensity zones */
export const f1Glow = {
  recovery: "f1-glow-recovery",
  aerobic: "f1-glow-aerobic",
  tempo: "f1-glow-tempo",
  threshold: "f1-glow-threshold",
  vo2: "f1-glow-vo2",
} as const;

/** F1 Divider classes */
export const f1Divider = {
  subtle: "f1-divider",
  glow: "f1-divider-glow",
  vertical: "f1-divider-vertical",
} as const;

/** F1 Layout spacing classes */
export const f1Layout = {
  page: "f1-page",
  sectionGap: "f1-section-gap",
  cardGap: "f1-card-gap",
  elementGap: "f1-element-gap",
  cardPadding: "f1-card-padding",
  cardPaddingLg: "f1-card-padding-lg",
  cardPaddingSm: "f1-card-padding-sm",
} as const;

/** F1 Animation classes */
export const f1Animation = {
  slideIn: "f1-animate-in",
  fadeIn: "f1-animate-fade",
  metricUpdate: "f1-animate-metric",
} as const;

/** Tailwind F1 spacing values (for gap-*, p-*, m-*, etc.) */
export const f1Spacing = {
  section: "f1-section",
  card: "f1-card",
  element: "f1-element",
} as const;

/** Tailwind F1 border radius values */
export const f1Radius = {
  default: "rounded-f1",
  lg: "rounded-f1-lg",
  sm: "rounded-f1-sm",
} as const;

/** Tailwind F1 font size values */
export const f1FontSize = {
  metricLg: "text-f1-metric-lg",
  metricMd: "text-f1-metric-md",
  metricSm: "text-f1-metric-sm",
  metricXs: "text-f1-metric-xs",
  label: "text-f1-label",
  labelMd: "text-f1-label-md",
  headlineLg: "text-f1-headline-lg",
  headlineMd: "text-f1-headline-md",
  headlineSm: "text-f1-headline-sm",
  body: "text-f1-body",
  bodySm: "text-f1-body-sm",
} as const;

/** Tailwind F1 color values */
export const f1Colors = {
  void: "bg-f1-void",
  telemetry: "text-f1-telemetry",
  telemetryBg: "bg-f1-telemetry",
  success: "text-f1-success",
  successBg: "bg-f1-success",
  warning: "text-f1-warning",
  warningBg: "bg-f1-warning",
  danger: "text-f1-danger",
  dangerBg: "bg-f1-danger",
  textPrimary: "text-f1-text-primary",
  textSecondary: "text-f1-text-secondary",
  textTertiary: "text-f1-text-tertiary",
  textMuted: "text-f1-text-muted",
} as const;
