import { useId } from 'react';

export interface WeekSummaryCardSvgProps {
  weekLabel: string;
  dateRange: string;
  totalTss: number;
  loadRatio: number; // 0-1
  completedPct: number; // 0-100
  workoutsDone: number;
  workoutsPlanned: number;
  ctl: number;
  isCurrent: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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
  const loadWidth = Math.round(clamp(loadRatio, 0, 1) * 260);
  const completionColor =
    completedPct >= 100 ? '#22c55e' : completedPct === 0 ? '#f59e0b' : '#38bdf8';

  return (
    <svg width="300" height="180" viewBox="0 0 300 180" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0b1220" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={`${id}-load`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="300" height="180" rx="16" fill={`url(#${id}-bg)`} />

      <text
        x="20"
        y="26"
        fontSize="11"
        letterSpacing="0.08em"
        fill="#94a3b8"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
      >
        {weekLabel.toUpperCase()}
      </text>

      <text
        x="20"
        y="48"
        fontSize="17"
        fontWeight="600"
        fill="#f8fafc"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
      >
        {dateRange}
      </text>

      {isCurrent && (
        <g transform="translate(206 18)">
          <rect width="74" height="24" rx="12" fill="#0ea5e9" opacity="0.14" />
          <text
            x="37"
            y="16"
            textAnchor="middle"
            fontSize="11"
            letterSpacing="0.06em"
            fill="#38bdf8"
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
          >
            CURRENT
          </text>
        </g>
      )}

      <text
        x="20"
        y="78"
        fontSize="11"
        letterSpacing="0.06em"
        fill="#64748b"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
      >
        TRAINING LOAD
      </text>

      <text
        x="280"
        y="78"
        fontSize="11"
        fill="#64748b"
        textAnchor="end"
        fontFamily="system-ui, -apple-system, Segoe UI, Roboto"
      >
        {totalTss} TSS
      </text>

      <rect x="20" y="86" width="260" height="6" rx="3" fill="#1e293b" />
      <rect x="20" y="86" width={loadWidth} height="6" rx="3" fill={`url(#${id}-load)`} />

      <g fontFamily="system-ui, -apple-system, Segoe UI, Roboto">
        <text x="20" y="122" fontSize="20" fontWeight="700" fill="#f8fafc">
          {workoutsDone}/{workoutsPlanned}
        </text>
        <text x="20" y="142" fontSize="11" fill="#64748b">
          WORKOUTS
        </text>

        <text x="130" y="122" fontSize="20" fontWeight="700" fill={completionColor}>
          {completedPct}%
        </text>
        <text x="130" y="142" fontSize="11" fill="#64748b">
          COMPLETED
        </text>

        <text x="230" y="122" fontSize="20" fontWeight="700" fill="#f8fafc">
          {ctl}
        </text>
        <text x="230" y="142" fontSize="11" fill="#64748b">
          CTL
        </text>
      </g>
    </svg>
  );
}
