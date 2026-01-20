/* ===============================
   AthleteSpace Telemetry Theme
   Unified design language extracted from landing page
   
   This file defines the shared DNA between:
   - Landing page (instrument introduction)
   - Dashboard (instrument operation)
   =============================== */

/**
 * Core background and surface colors
 * Extracted from landing TelemetryHero and TelemetryNav
 */
export const telemetryColors = {
  /** Primary void background - slate-950 equivalent */
  bg: 'bg-slate-950',
  /** HSL value for CSS variables */
  bgHsl: '222 47% 5%',
  
  /** Glass surface with backdrop blur */
  glassBg: 'bg-slate-950/80',
  glassBackdrop: 'backdrop-blur-sm',
  
  /** Grid pattern - reduced opacity for subtlety */
  gridOpacity: 'opacity-[0.027]',
  gridColor: 'hsl(215, 20%, 30%)',
  gridSize: '80px',
  
  /** Dashboard grid - even more subtle */
  dashboardGridOpacity: 'opacity-[0.04]',
} as const;

/**
 * Border and divider colors
 * Consistent edge treatment across landing and dashboard
 */
export const telemetryBorders = {
  /** Primary divider - landing status band style */
  divider: 'border-slate-800/50',
  /** Subtle divider for internal separations */
  subtle: 'border-white/10',
  /** Emphasis divider - hover states */
  emphasis: 'border-white/20',
  /** Vertical separator in status bands */
  separator: 'bg-slate-700/50',
} as const;

/**
 * Text hierarchy - landing page contrast levels
 * Numbers louder than labels
 */
export const telemetryText = {
  /** Primary headlines and metric values */
  primary: 'text-slate-200',
  /** Secondary body text */
  secondary: 'text-slate-400',
  /** Labels and metadata - low contrast */
  label: 'text-slate-500',
  /** Muted / disabled text */
  muted: 'text-slate-600',
  /** Ultra-muted hints */
  hint: 'text-slate-700',
} as const;

/**
 * Typography patterns - landing page DNA
 * Monospace for data, sans for context
 */
export const telemetryTypography = {
  /** Status band labels - uppercase, tracked */
  statusLabel: 'text-[11px] tracking-[0.15em] font-mono uppercase',
  /** Status values */
  statusValue: 'text-[11px] tracking-[0.15em] font-mono uppercase',
  /** Metric labels - small, tracked */
  metricLabel: 'text-[11px] tracking-[0.12em] font-mono uppercase',
  /** Metric values - slightly larger */
  metricValue: 'text-slate-300 font-mono',
  /** System labels - ultra small */
  systemLabel: 'text-[10px] font-mono tracking-wider',
  /** Tabular numbers for metrics */
  tabularNums: 'font-mono tabular-nums tracking-tight',
} as const;

/**
 * Status indicators - semantic colors
 * Matches landing TelemetryStatusBand trend colors
 */
export const telemetryStatus = {
  /** Safe/optimal state */
  safe: 'text-emerald-400',
  safeBg: 'bg-emerald-400/10',
  safeBorder: 'border-emerald-400/20',
  
  /** Caution/warning state */
  caution: 'text-amber-400',
  cautionBg: 'bg-amber-400/10',
  cautionBorder: 'border-amber-400/20',
  
  /** Danger/risk state */
  danger: 'text-red-400',
  dangerBg: 'bg-red-400/10',
  dangerBorder: 'border-red-400/20',
  
  /** Active/telemetry signal */
  active: 'text-blue-400',
  activeBg: 'bg-blue-400/10',
  activeBorder: 'border-blue-400/20',
} as const;

/**
 * Trend indicators - direction arrows
 */
export const telemetryTrends = {
  up: '↑',
  down: '↓',
  stable: '→',
  delta: 'Δ',
} as const;

/**
 * Composite classes for common patterns
 */
export const telemetryPatterns = {
  /** Status band container - matches TelemetryStatusBand */
  statusBand: 'w-full border-b border-slate-800/50',
  /** Status band inner container */
  statusBandInner: 'flex items-center justify-between py-3 text-[11px] tracking-[0.15em] font-mono',
  
  /** Telemetry strip - horizontal metric row */
  strip: 'w-full bg-slate-900/30 border-y border-slate-800/30 py-4',
  
  /** Grid background pattern - landing hero style */
  gridPattern: `absolute inset-0 opacity-[0.027]`,
  
  /** Dashboard grid - more subtle for operation mode */
  dashboardGrid: 'absolute inset-0 opacity-[0.04] pointer-events-none',
  
  /** Bottom reference line - visual anchor */
  bottomLine: 'absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800/50 to-transparent',
} as const;

/**
 * Metric display patterns - F1 telemetry style
 * These replace friendly marketing language with system language
 */
export const telemetryMetricLabels = {
  // Training metrics
  status: 'STATUS',
  load: 'LOAD',
  readiness: 'READINESS',
  risk: 'RISK',
  adaptation: 'ADAPTATION',
  recovery: 'RECOVERY',
  strain: 'STRAIN',
  
  // Time-bound metrics
  load7d: 'LOAD (7d)',
  load14d: 'LOAD (14d)',
  trend7d: 'TREND (7d)',
  
  // Delta metrics
  paceDelta: 'PACE Δ',
  ctlDelta: 'CTL Δ',
  tsbDelta: 'TSB Δ',
  
  // Status values
  building: 'BUILDING',
  maintaining: 'MAINTAINING',
  recovering: 'RECOVERING',
  peaking: 'PEAKING',
  
  // Load status values
  withinRange: 'WITHIN RANGE',
  elevated: 'ELEVATED',
  reduced: 'REDUCED',
  
  // Risk levels
  low: 'LOW',
  moderate: 'MODERATE',
  high: 'HIGH',
  
  // Decision values
  optimal: 'OPTIMAL',
  stable: 'STABLE',
  positive: 'POSITIVE',
  negative: 'NEGATIVE',
} as const;

/**
 * Decision language - telemetry style
 * Replaces friendly language with system language
 */
export const telemetryDecisions = {
  // Replace "Your training is improving!" with:
  adaptationStable: 'ADAPTATION STABLE · TREND POSITIVE',
  adaptationBuilding: 'ADAPTATION BUILDING · ON TRACK',
  adaptationCaution: 'ADAPTATION STRAIN · MONITOR',
  
  // Replace "Good recovery" with:
  recoveryOptimal: 'RECOVERY: OPTIMAL',
  recoveryPartial: 'RECOVERY: PARTIAL',
  recoveryCritical: 'RECOVERY: CRITICAL',
  
  // Replace "Proceed" with:
  proceedGreen: 'PROCEED · SYSTEMS GREEN',
  proceedCaution: 'PROCEED · MONITOR LOAD',
  
  // Replace "Modify" with:
  modifyIntensity: 'MODIFY · REDUCE INTENSITY',
  modifyDuration: 'MODIFY · REDUCE DURATION',
  
  // Replace "Rest" with:
  restRequired: 'REST · RECOVERY REQUIRED',
  restOptional: 'REST · OPTIONAL RECOVERY',
} as const;

/**
 * Spacing rhythm - consistent across landing and dashboard
 */
export const telemetrySpacing = {
  /** Between status items */
  statusGap: 'gap-6',
  /** Between metric groups */
  metricGap: 'gap-8',
  /** Section padding */
  sectionPadding: 'px-6 py-3',
  /** Divider margins */
  dividerMargin: 'my-4',
} as const;

/**
 * Generate CSS grid pattern style
 */
export function getGridPatternStyle(size: string = '80px'): React.CSSProperties {
  return {
    backgroundImage: `
      linear-gradient(to right, hsl(215, 20%, 30%) 1px, transparent 1px),
      linear-gradient(to bottom, hsl(215, 20%, 30%) 1px, transparent 1px)
    `,
    backgroundSize: `${size} ${size}`,
  };
}

/**
 * Format metric value with delta indicator
 */
export function formatDelta(value: number, showSign: boolean = true): string {
  if (showSign) {
    return value >= 0 ? `+${value}` : `${value}`;
  }
  return `${value}`;
}

/**
 * Format metric with unit suffix
 */
export function formatMetricWithUnit(value: number, unit: string): string {
  return `${value}${unit}`;
}
