import { CALENDAR_CARD_THEMES } from './calendarCardThemes';
import { toTitleCase } from './cardSvgUtils';

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

// Neutral color palette - matches shadcn/Dashboard styling
const COLORS = {
  grid: 'rgba(148, 163, 184, 0.03)',
  border: 'rgba(148, 163, 184, 0.12)',
  borderSubtle: 'rgba(148, 163, 184, 0.06)',
};


export function BaseCalendarCardSvg({
  variant,
  topLeft,
  topRight,
  metricsLabel,
  metricsValue,
  title,
  description,
  titleClampLines = 2,
  descClampLines = 3,
  viewVariant,
  isActivity = false,
  isPlanned = false,
}: BaseCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant] ?? CALENDAR_CARD_THEMES['completed-running'];
  const isMonthView = viewVariant === 'month';

  const showMetrics = Boolean(metricsLabel && metricsValue);
  const displayTitle = toTitleCase(title);

  // Tighter dimensions for month view
  const viewBoxHeight = isMonthView ? 280 : 400;
  
  // Typography scale - tighter, more instrumentation-like
  const topRowFontSize = isMonthView ? 22 : 24;
  const metricsLabelFontSize = isMonthView ? 10 : 11;
  const metricsValueFontSize = isMonthView ? 20 : 22;
  const titleFontSize = isMonthView ? 28 : 34;
  const descFontSize = isMonthView ? 18 : 22;

  const id = `calendar-card-${variant}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 360 ${viewBoxHeight}`}
      preserveAspectRatio={isMonthView ? 'none' : 'xMidYMid meet'}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <defs>
        {/* Flat background - matches Card component */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.base} stopOpacity="1" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.95" />
        </linearGradient>

        {/* Trace gradient using theme accent */}
        <linearGradient id={`${id}-trace`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={theme.sparkline} stopOpacity="0.2" />
          <stop offset="50%" stopColor={theme.sparkline} stopOpacity="0.6" />
          <stop offset="100%" stopColor={theme.sparkline} stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Background - flat, matching Card component */}
      <rect width="360" height={viewBoxHeight} rx="8" fill={`url(#${id}-bg)`} />
      
      {/* Border - consistent with shadcn Card */}
      <rect 
        x="0.5" 
        y="0.5" 
        width="359" 
        height={viewBoxHeight - 1} 
        rx="7.5" 
        fill="none" 
        stroke={COLORS.border} 
        strokeWidth="1" 
      />

      {/* TOP ROW - clean header style */}
      <text 
        x="16" 
        y="28" 
        fill={theme.text} 
        fontSize={topRowFontSize} 
        fontWeight="600"
        letterSpacing="-0.01em"
      >
        {topLeft}
      </text>
      <text 
        x="344" 
        y="28" 
        fill={theme.secondary} 
        fontSize={topRowFontSize - 4} 
        fontWeight="500" 
        textAnchor="end"
        opacity="0.6"
      >
        {topRight}
      </text>

      {/* Divider line */}
      <line x1="16" y1="40" x2="344" y2="40" stroke={COLORS.borderSubtle} strokeWidth="1" />

      {/* METRICS - small caps labels */}
      {showMetrics && (
        <>
          <text 
            x="16" 
            y={isMonthView ? 58 : 64} 
            fill={theme.secondary} 
            fontSize={metricsLabelFontSize} 
            letterSpacing="0.08em"
            opacity="0.6"
          >
            {metricsLabel?.toUpperCase()}
          </text>
          <text 
            x="16" 
            y={isMonthView ? 78 : 88} 
            fill={theme.text} 
            fontSize={metricsValueFontSize} 
            fontWeight="500"
          >
            {metricsValue}
          </text>
        </>
      )}

      {/* TITLE */}
      <foreignObject x="16" y={isMonthView ? 50 : 60} width="328" height={isMonthView ? 56 : 72}>
        <div
          style={{
            color: theme.text,
            fontSize: `${titleFontSize}px`,
            fontWeight: 600,
            lineHeight: 1.15,
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
        <foreignObject x="16" y={isMonthView ? 104 : 128} width="328" height={isMonthView ? 48 : 64}>
          <div
            style={{
              color: theme.secondary,
              fontSize: `${descFontSize}px`,
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

      {/* ACCENT LINE - subtle accent indicator at bottom */}
      {(isActivity || isPlanned) && (
        <g transform={`translate(16,${isMonthView ? 220 : 340})`}>
          {/* Accent bar */}
          <rect 
            x="0" 
            y="0" 
            width="328" 
            height="3" 
            rx="1.5"
            fill={theme.sparkline}
            opacity="0.3"
          />
          {/* Progress indicator (for activities with data) */}
          {isActivity && (
            <rect 
              x="0" 
              y="0" 
              width="164" 
              height="3" 
              rx="1.5"
              fill={theme.sparkline}
              opacity="0.8"
            />
          )}
        </g>
      )}
    </svg>
  );
}
