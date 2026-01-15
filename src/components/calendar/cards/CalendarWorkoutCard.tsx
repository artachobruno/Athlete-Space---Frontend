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
  const showSparkline = theme.showSparkline && sparkline && sparkline.length > 0;

  // Format secondary metrics
  const secondaryMetrics = [];
  if (distance) {
    secondaryMetrics.push(distance);
  }
  if (pace) {
    secondaryMetrics.push(pace);
  }
  const secondaryText = secondaryMetrics.length > 0 ? secondaryMetrics.join(' · ') : undefined;

  return (
    <svg width="360" height="460" viewBox="0 0 360 460" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradient background */}
        <linearGradient id={`gradient-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.base} stopOpacity="1" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.95" />
        </linearGradient>

        {/* Glass overlay gradient */}
        <linearGradient id={`glass-${variant}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.05" />
        </linearGradient>

        {/* Drop shadow filter */}
        <filter id={`shadow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="8" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Card container with rounded corners */}
      <rect
        width="360"
        height="460"
        rx="28"
        fill={`url(#gradient-${variant})`}
        filter={`url(#shadow-${variant})`}
      />

      {/* Glass overlay */}
      <rect
        width="360"
        height="460"
        rx="28"
        fill={`url(#glass-${variant})`}
      />

      {/* Top row: Duration (left) and Workout type (right) */}
      <text
        x="28"
        y="40"
        fontSize="14"
        fontWeight="600"
        fill={theme.text}
        fontFamily="Space Grotesk, Inter, system-ui, -apple-system, sans-serif"
      >
        {duration}
      </text>
      <text
        x="332"
        y="40"
        fontSize="14"
        fontWeight="600"
        fill={theme.text}
        textAnchor="end"
        fontFamily="Space Grotesk, Inter, system-ui, -apple-system, sans-serif"
      >
        {workoutType}
      </text>

      {/* Secondary metrics label */}
      {secondaryText && (
        <>
          <text
            x="28"
            y="70"
            fontSize="10"
            fontWeight="500"
            fill={theme.secondary}
            fontFamily="Space Grotesk, Inter, system-ui, -apple-system, sans-serif"
            letterSpacing="0.5px"
          >
            DISTANCE — AVG PACE
          </text>
          <text
            x="28"
            y="88"
            fontSize="12"
            fontWeight="500"
            fill={theme.text}
            fontFamily="Space Grotesk, Inter, system-ui, -apple-system, sans-serif"
          >
            {secondaryText}
          </text>
        </>
      )}

      {/* Title - largest text, positioned mid-card */}
      <text
        x="28"
        y="140"
        fontSize="20"
        fontWeight="700"
        fill={theme.text}
        fontFamily="Space Grotesk, Inter, system-ui, -apple-system, sans-serif"
      >
        {title.length > 40 ? `${title.substring(0, 37)}...` : title}
      </text>

      {/* Description / Coach annotation */}
      {description && (
        <foreignObject x="28" y="170" width="304" height="140">
          <div
            style={{
              fontFamily: 'Space Grotesk, Inter, system-ui, -apple-system, sans-serif',
              fontSize: '12px',
              lineHeight: '1.5',
              color: theme.text,
              maxHeight: '140px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 6,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </div>
        </foreignObject>
      )}

      {/* Sparkline - bottom of card, stroke only, no axes */}
      {showSparkline && sparkline && (
        <g transform="translate(28, 400)">
          <polyline
            points={sparkline
              .map((v, i) => {
                const x = (i / (sparkline.length - 1 || 1)) * 304;
                const y = 40 - (v * 30);
                return `${x},${y}`;
              })
              .join(' ')}
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
