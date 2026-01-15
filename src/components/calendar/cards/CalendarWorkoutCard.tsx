/**
 * CalendarWorkoutCard
 *
 * Pure SVG renderer for calendar workout cards.
 * Liquid-glass / glassmorphic with defined edges, clipped, stack-safe.
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

  const secondaryText =
    distance || pace
      ? [distance, pace].filter(Boolean).join(' · ')
      : null;

  const showSparkline =
    theme.showSparkline && Array.isArray(sparkline) && sparkline.length > 0;

  const id = `calendar-card-${variant}`;
  const filterId = `${id}-liquid-glass`;
  const displayTitle = toTitleCase(title);

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
        {/* Base background tint */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={theme.base} stopOpacity="0.85" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.55" />
        </linearGradient>

        {/* Glass highlight */}
        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.09)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>

        {/* Inner glass edge */}
        <linearGradient id={`${id}-inner-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>

        {/* Outer edge */}
        <linearGradient id={`${id}-outer-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.40)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>

        {/* Liquid-glass refraction filter */}
        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          {/* Base blur for softness */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blurred" />

          {/* Noise for subtle liquid warping */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="3"
            stitchTiles="noStitch"
            result="noise"
          />

          {/* Displace the blurred content with noise to get “liquid” edges */}
          <feDisplacementMap
            in="blurred"
            in2="noise"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />

          {/* Slight saturation/contrast tweak */}
          <feColorMatrix
            in="displaced"
            type="matrix"
            values="
              1.05 0    0    0   0
              0    1.05 0    0   0
              0    0    1.08 0   0
              0    0    0    1   0
            "
            result="adjusted"
          />

          {/* Blend with original for crisp text/edges */}
          <feBlend
            in="adjusted"
            in2="SourceGraphic"
            mode="normal"
            result="liquidGlass"
          />
        </filter>

        {/* Shadow */}
        <filter
          id={`${id}-shadow`}
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="28"
            floodColor="#000"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      {/* Shadow */}
      <rect
        width="360"
        height="460"
        rx="28"
        fill="transparent"
        filter={`url(#${id}-shadow)`}
      />

      {/* Card group with liquid-glass filter */}
      <g filter={`url(#${filterId})`}>
        {/* Base */}
        <rect width="360" height="460" rx="28" fill={`url(#${id}-bg)`} />

        {/* Glass overlay */}
        <rect width="360" height="460" rx="28" fill={`url(#${id}-glass)`} />

        {/* Edges */}
        <rect
          x="1"
          y="1"
          width="358"
          height="458"
          rx="27"
          fill="none"
          stroke={`url(#${id}-inner-edge)`}
        />
        <rect
          x="0.5"
          y="0.5"
          width="359"
          height="459"
          rx="27.5"
          fill="none"
          stroke={`url(#${id}-outer-edge)`}
        />
      </g>

      {/* TOP ROW */}
      <text
        x="28"
        y="52"
        fill={theme.text}
        fontSize="20"
        fontWeight="600"
      >
        {duration}
      </text>

      <text
        x="332"
        y="52"
        fill={theme.secondary}
        fontSize="20"
        fontWeight="600"
        textAnchor="end"
      >
        {workoutType}
      </text>

      {/* METRICS */}
      {secondaryText && (
        <>
          <text
            x="28"
            y="82"
            fill={theme.secondary}
            fontSize="11"
            letterSpacing="0.08em"
          >
            DISTANCE · AVG PACE
          </text>
          <text
            x="28"
            y="108"
            fill={theme.text}
            fontSize="20"
            fontWeight="500"
          >
            {secondaryText}
          </text>
        </>
      )}

      {/* TITLE */}
      <foreignObject x="28" y="142" width="304" height="88">
        <div
          style={{
            color: theme.text,
            fontSize: '30px',
            fontWeight: 700,
            lineHeight: 1.15,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayTitle}
        </div>
      </foreignObject>

      {/* DESCRIPTION */}
      {description && (
        <foreignObject x="28" y="232" width="304" height="120">
          <div
            style={{
              color: theme.secondary,
              fontSize: '16px',
              lineHeight: 1.45,
              opacity: 0.95,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </div>
        </foreignObject>
      )}

      {/* PACE GRAPH */}
      {showSparkline && sparkline && (
        <g transform="translate(28,380)">
          <path
            d={generateSparklinePath(sparkline, 304, 36)}
            fill="none"
            stroke="rgba(230,238,255,0.9)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}

/* ---------------- Utils ---------------- */

function toTitleCase(input: string): string {
  return input.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Sparkline generator (0–1 normalized values)
 * NOTE: For pace graphs, adapter should invert/normalize.
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
