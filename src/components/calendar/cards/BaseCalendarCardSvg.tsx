import { CALENDAR_CARD_THEMES } from './calendarCardThemes';
import { generateSparklinePath, toTitleCase, generateWavyLinePath } from './cardSvgUtils';

export interface BaseCardProps {
  variant: string;
  topLeft: string;
  topRight: string;
  metricsLabel?: string;
  metricsValue?: string;
  title: string;
  description?: string | null;
  sparkline?: number[] | null;
  titleClampLines?: number;
  descClampLines?: number;
  viewVariant?: 'month' | 'week' | 'plan';
  isActivity?: boolean;
  isPlanned?: boolean;
}

export function BaseCalendarCardSvg({
  variant,
  topLeft,
  topRight,
  metricsLabel,
  metricsValue,
  title,
  description,
  sparkline,
  titleClampLines = 2,
  descClampLines = 3,
  viewVariant,
  isActivity = false,
  isPlanned = false,
}: BaseCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant] ?? CALENDAR_CARD_THEMES['completed-running'];
  const isMonthView = viewVariant === 'month';

  const showMetrics = Boolean(metricsLabel && metricsValue);
  const showSparkline =
    theme.showSparkline && Array.isArray(sparkline) && (sparkline?.length ?? 0) > 0;

  const id = `calendar-card-${variant}`;
  const filterId = `${id}-liquid-glass`;
  const displayTitle = toTitleCase(title);

  // For month view: reduce height (from 460 to 320) and increase fonts
  const viewBoxHeight = isMonthView ? 320 : 460;
  const topRowFontSize = 28;
  const metricsLabelFontSize = isMonthView ? 16 : 14;
  const metricsValueFontSize = isMonthView ? 28 : 24;
  const titleFontSize = 40;
  const descFontSize = 32;

  // Telemetry style: reduced radius, no heavy shadows
  const borderRadius = 12; // Reduced from 28

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 360 ${viewBoxHeight}`}
      preserveAspectRatio={isMonthView ? 'none' : 'xMidYMid meet'}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <defs>
        {/* Simplified background - flat, no glass effect */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.base} stopOpacity="0.75" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.60" />
        </linearGradient>

        {/* Subtle top edge highlight only */}
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Main card - flat, no shadow filter */}
      <rect 
        width="360" 
        height={viewBoxHeight} 
        rx={borderRadius} 
        fill={`url(#${id}-bg)`} 
      />
      
      {/* Thin border - subtle */}
      <rect 
        x="0.5" 
        y="0.5" 
        width="359" 
        height={viewBoxHeight - 1} 
        rx={borderRadius - 0.5} 
        fill="none" 
        stroke="rgba(255,255,255,0.08)" 
        strokeWidth="1"
      />
      
      {/* Left accent border - telemetry style */}
      <rect
        x="0"
        y="12"
        width="2"
        height={viewBoxHeight - 24}
        fill={theme.sparkline || theme.text}
        opacity="0.4"
      />

      {/* TOP ROW - telemetry style: left-aligned labels */}
      <text 
        x="20" 
        y="40" 
        fill={theme.secondary} 
        fontSize={topRowFontSize - 6} 
        fontWeight="500"
        letterSpacing="0.08em"
        style={{ textTransform: 'uppercase' } as React.CSSProperties}
      >
        {topLeft}
      </text>
      <text 
        x="340" 
        y="40" 
        fill={theme.secondary} 
        fontSize={topRowFontSize - 8} 
        fontWeight="400"
        textAnchor="end"
        opacity="0.6"
      >
        {topRight}
      </text>

      {/* METRICS - duration dominant */}
      {showMetrics && (
        <>
          <text 
            x="20" 
            y={isMonthView ? 70 : 74} 
            fill={theme.secondary} 
            fontSize={metricsLabelFontSize - 2} 
            letterSpacing="0.1em"
            opacity="0.5"
          >
            {metricsLabel}
          </text>
          <text 
            x="20" 
            y={isMonthView ? 96 : 102} 
            fill={theme.text} 
            fontSize={metricsValueFontSize + 4} 
            fontWeight="600"
            style={{ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}
          >
            {metricsValue}
          </text>
        </>
      )}

      {/* TITLE - left aligned, tighter */}
      <foreignObject x="20" y="75" width="320" height={isMonthView ? 60 : 80}>
        <div
          style={{
            color: theme.text,
            fontSize: `${titleFontSize - 4}px`,
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: titleClampLines,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayTitle}
        </div>
      </foreignObject>

      {/* DESCRIPTION - muted */}
      {description && (
        <foreignObject x="20" y="115" width="320" height={isMonthView ? 80 : 100}>
          <div
            style={{
              color: theme.secondary,
              fontSize: `${descFontSize - 4}px`,
              lineHeight: 1.4,
              opacity: 0.7,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: descClampLines,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {description}
          </div>
        </foreignObject>
      )}

      {/* Telemetry trace - subtle, de-emphasized */}
      {(isActivity || isPlanned) && (
        <g transform={`translate(20,${isMonthView ? 220 : 260})`} opacity="0.5">
          <path
            d={generateWavyLinePath(320, 28, isActivity ? 'speed' : 'steps')}
            fill="none"
            stroke={theme.sparkline}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
      
      {/* Bottom baseline - telemetry style */}
      <line
        x1="20"
        y1={viewBoxHeight - 16}
        x2="340"
        y2={viewBoxHeight - 16}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
    </svg>
  );
}
