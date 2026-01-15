/**
 * CalendarWorkoutCard
 *
 * Pure SVG renderer for calendar workout cards.
 * RESPONSIVE, CLIPPED, AND STACK-SAFE.
 * No layout logic, no React state.
 */

import { CALENDAR_CARD_THEMES } from './calendarCardThemes';
import type { CalendarCardProps } from './calendarCardAdapter';

export function CalendarWorkoutCard({
  variant,
  duration,
  workoutType,
  title,
  distance,
  pace,
  description,
  sparkline,
}: CalendarCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant];
  const showSparkline =
    theme.showSparkline && Array.isArray(sparkline) && sparkline.length > 0;

  const secondaryText =
    distance || pace
      ? [distance, pace].filter(Boolean).join(' · ')
      : null;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 360 460"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        fontFamily:
          'Space Grotesk, Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id={`bg-${variant}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={theme.base} />
          <stop offset="100%" stopColor={theme.base} />
        </linearGradient>

        {/* Glass overlay */}
        <linearGradient id={`glass-${variant}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
        </linearGradient>

        {/* Shadow */}
        <filter id={`shadow-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="28" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Card base */}
      <rect
        width="360"
        height="460"
        rx="28"
        fill={`url(#bg-${variant})`}
        filter={`url(#shadow-${variant})`}
      />
      <rect
        width="360"
        height="460"
        rx="28"
        fill={`url(#glass-${variant})`}
      />

      {/* TOP ROW */}
      <text
        x="28"
        y="56"
        fill={theme.text}
        fontSize="22"
        fontWeight="600"
        letterSpacing="-0.01em"
      >
        {duration}
      </text>

      <text
        x="332"
        y="56"
        fill={theme.secondary}
        fontSize="22"
        fontWeight="600"
        textAnchor="end"
        letterSpacing="-0.01em"
      >
        {workoutType}
      </text>

      {/* SECONDARY METRICS */}
      {secondaryText && (
        <>
          <text
            x="28"
            y="90"
            fill={theme.secondary}
            fontSize="12"
            letterSpacing="0.08em"
          >
            DISTANCE — AVG PACE
          </text>

          <text
            x="28"
            y="118"
            fill={theme.text}
            fontSize="20"
            fontWeight="500"
          >
            {secondaryText}
          </text>
        </>
      )}

      {/* TITLE */}
      <text
        x="28"
        y="190"
        fill={theme.text}
        fontSize="34"
        fontWeight="700"
        letterSpacing="-0.02em"
      >
        {title.length > 28 ? `${title.slice(0, 25)}…` : title}
      </text>

      {/* DESCRIPTION / COACH NOTE */}
      {description && (
        <foreignObject x="28" y="220" width="304" height="140">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              color: theme.secondary,
              fontSize: '17px',
              lineHeight: '1.45',
              opacity: 0.95,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </div>
        </foreignObject>
      )}

      {/* SPARKLINE */}
      {showSparkline && sparkline && (
        <g transform="translate(28, 380)">
          <path
            d={generateSparklinePath(sparkline, 304, 32)}
            fill="none"
            stroke={theme.sparkline}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

/**
 * Sparkline generator (0–1 normalized values)
 */
function generateSparklinePath(
  data: number[],
  width: number,
  height: number
): string {
  if (!data.length) return '';

  const step = width / (data.length - 1 || 1);

  return data
    .map((v, i) => {
      const x = i * step;
      const y = height - v * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}
