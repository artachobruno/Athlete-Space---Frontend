import { useId, useState, useEffect } from 'react';

interface WeekSummaryCardSvgProps {
  weekLabel: string;
  dateRange: string;
  totalTss: number;
  loadRatio: number;
  completedPct: number;
  workoutsDone: number;
  workoutsPlanned: number;
  ctl: number;
  isCurrent: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// Telemetry color palette
const COLORS = {
  bg: '#0b1220',
  bgAlt: '#020617',
  grid: 'rgba(148, 163, 184, 0.06)',
  border: 'rgba(148, 163, 184, 0.12)',
  text: '#f8fafc',
  textMuted: '#64748b',
  textSecondary: '#94a3b8',
  accent: '#38bdf8',
  accentDim: '#0ea5e9',
  success: '#22c55e',
  warning: '#f59e0b',
};

export function WeekSummaryCardSvg({
  weekLabel,
  dateRange,
  totalTss,
  loadRatio,
  completedPct,
  workoutsDone,
  workoutsPlanned,
  ctl,
  isCurrent,
}: WeekSummaryCardSvgProps) {
  const rawId = useId();
  const id = `week-summary-${rawId.replace(/:/g, '')}`;
  const loadWidth = Math.round(clamp(loadRatio, 0, 1) * 240);
  
  // Mount animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Status color based on completion
  const statusColor = completedPct >= 100 ? COLORS.success : completedPct === 0 ? COLORS.warning : COLORS.accent;
  
  // Grid size
  const gridSize = 20;

  return (
    <svg 
      width="300" 
      height="160" 
      viewBox="0 0 300 160" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={COLORS.bg} />
          <stop offset="100%" stopColor={COLORS.bgAlt} />
        </linearGradient>
        
        {/* Load bar gradient */}
        <linearGradient id={`${id}-load`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={COLORS.accentDim} stopOpacity="0.8" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0.6" />
        </linearGradient>
        
        {/* Grid pattern */}
        <pattern id={`${id}-grid`} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path 
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} 
            fill="none" 
            stroke={COLORS.grid} 
            strokeWidth="0.5" 
          />
        </pattern>

        {/* Subtle glow for current week */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width="300" height="160" rx="8" fill={`url(#${id}-bg)`} />
      <rect x="0" y="0" width="300" height="160" rx="8" fill={`url(#${id}-grid)`} />
      
      {/* Border */}
      <rect 
        x="0.5" 
        y="0.5" 
        width="299" 
        height="159" 
        rx="7.5" 
        fill="none" 
        stroke={isCurrent ? COLORS.accent : COLORS.border} 
        strokeWidth={isCurrent ? 1.5 : 0.5}
        strokeOpacity={isCurrent ? 0.6 : 1}
      />

      {/* Week label - small caps */}
      <text
        x="16"
        y="22"
        fontSize="9"
        letterSpacing="0.12em"
        fill={COLORS.textSecondary}
        textAnchor="start"
        style={{ textTransform: 'uppercase' }}
      >
        {weekLabel.toUpperCase()}
      </text>

      {/* Date range */}
      <text
        x="16"
        y="40"
        fontSize="13"
        fontWeight="500"
        letterSpacing="-0.01em"
        fill={COLORS.text}
      >
        {dateRange}
      </text>

      {/* Current badge */}
      {isCurrent && (
        <g transform="translate(220 12)" filter={`url(#${id}-glow)`}>
          <rect width="64" height="18" rx="2" fill={COLORS.accent} opacity="0.12" />
          <rect width="64" height="18" rx="2" fill="none" stroke={COLORS.accent} strokeWidth="0.5" strokeOpacity="0.4" />
          <text
            x="32"
            y="12"
            textAnchor="middle"
            fontSize="8"
            letterSpacing="0.1em"
            fill={COLORS.accent}
          >
            CURRENT
          </text>
        </g>
      )}

      {/* Divider line */}
      <line x1="16" y1="52" x2="284" y2="52" stroke={COLORS.border} strokeWidth="0.5" />

      {/* Load section */}
      <text
        x="16"
        y="68"
        fontSize="8"
        letterSpacing="0.1em"
        fill={COLORS.textMuted}
      >
        LOAD
      </text>
      
      <text
        x="284"
        y="68"
        fontSize="9"
        fill={COLORS.textSecondary}
        textAnchor="end"
        fontWeight="500"
      >
        {totalTss}
        <tspan fontSize="7" fill={COLORS.textMuted}> TSS</tspan>
      </text>

      {/* Load bar background */}
      <rect x="16" y="74" width="240" height="4" rx="1" fill={COLORS.border} />
      
      {/* Load bar fill with animation */}
      <rect 
        x="16" 
        y="74" 
        width={mounted ? loadWidth : 0} 
        height="4" 
        rx="1" 
        fill={`url(#${id}-load)`}
        style={{ transition: 'width 0.6s ease-out' }}
      />

      {/* Metrics row */}
      <g transform="translate(16 94)">
        {/* Workouts */}
        <g>
          <text fontSize="18" fontWeight="600" fill={COLORS.text} y="14">
            {workoutsDone}
            <tspan fontSize="11" fontWeight="400" fill={COLORS.textMuted}>/{workoutsPlanned}</tspan>
          </text>
          <text y="28" fontSize="7" letterSpacing="0.1em" fill={COLORS.textMuted}>
            SESSIONS
          </text>
        </g>

        {/* Completion */}
        <g transform="translate(100 0)">
          <text fontSize="18" fontWeight="600" fill={statusColor} y="14">
            {completedPct}
            <tspan fontSize="10" fontWeight="400">%</tspan>
          </text>
          <text y="28" fontSize="7" letterSpacing="0.1em" fill={COLORS.textMuted}>
            COMPLETE
          </text>
        </g>

        {/* CTL */}
        <g transform="translate(190 0)">
          <text fontSize="18" fontWeight="600" fill={COLORS.text} y="14">
            {ctl}
          </text>
          <text y="28" fontSize="7" letterSpacing="0.1em" fill={COLORS.textMuted}>
            CTL
          </text>
        </g>
      </g>

      {/* Bottom telemetry trace - subtle signal line */}
      <g transform="translate(16 148)">
        <path
          d={`M 0 0 ${Array.from({ length: 20 }, (_, i) => {
            const x = i * 13.5;
            const y = Math.sin(i * 0.8 + workoutsDone) * 3;
            return `L ${x} ${y}`;
          }).join(' ')}`}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth="0.75"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
