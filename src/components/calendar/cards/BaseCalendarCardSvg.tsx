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

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 360 ${viewBoxHeight}`}
      preserveAspectRatio={isMonthView ? 'none' : 'xMidYMid meet'}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        fontFamily: 'Space Grotesk, Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={theme.base} stopOpacity="0.85" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.55" />
        </linearGradient>

        <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.09)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>

        <linearGradient id={`${id}-inner-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>

        <linearGradient id={`${id}-outer-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(0,0,0,0.40)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>

        <filter
          id={filterId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="blurred" />
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="2"
            seed="3"
            stitchTiles="noStitch"
            result="noise"
          />
          <feDisplacementMap
            in="blurred"
            in2="noise"
            scale="12"
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
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
          <feBlend in="adjusted" in2="SourceGraphic" mode="normal" result="liquidGlass" />
        </filter>

        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="28"
            floodColor="#000"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <rect width="360" height={viewBoxHeight} rx="28" fill="transparent" filter={`url(#${id}-shadow)`} />

      <g filter={`url(#${filterId})`}>
        <rect width="360" height={viewBoxHeight} rx="28" fill={`url(#${id}-bg)`} />
        <rect width="360" height={viewBoxHeight} rx="28" fill={`url(#${id}-glass)`} />
        <rect x="1" y="1" width="358" height={viewBoxHeight - 2} rx="27" fill="none" stroke={`url(#${id}-inner-edge)`} />
        <rect x="0.5" y="0.5" width="359" height={viewBoxHeight - 1} rx="27.5" fill="none" stroke={`url(#${id}-outer-edge)`} />
      </g>

      {/* TOP ROW */}
      <text x="28" y="48" fill={theme.text} fontSize={topRowFontSize} fontWeight="600">
        {topLeft}
      </text>
      <text x="332" y="48" fill={theme.secondary} fontSize={topRowFontSize} fontWeight="600" textAnchor="end">
        {topRight}
      </text>

      {/* METRICS */}
      {showMetrics && (
        <>
          <text x="28" y={isMonthView ? 78 : 82} fill={theme.secondary} fontSize={metricsLabelFontSize} letterSpacing="0.08em">
            {metricsLabel}
          </text>
          <text x="28" y={isMonthView ? 104 : 108} fill={theme.text} fontSize={metricsValueFontSize} fontWeight="500">
            {metricsValue}
          </text>
        </>
      )}

      {/* TITLE */}
      <foreignObject x="28" y="80" width="315" height={isMonthView ? 70 : 88}>
        <div
          style={{
            color: theme.text,
            fontSize: `${titleFontSize}px`,
            fontWeight: 700,
            lineHeight: 1.15,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: titleClampLines,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayTitle}
        </div>
      </foreignObject>

      {/* DESCRIPTION */}
      {description && (
        <foreignObject x="28" y="125" width="315" height={isMonthView ? 90 : 120}>
          <div
            style={{
              color: theme.secondary,
              fontSize: `${descFontSize}px`,
              lineHeight: 1.45,
              opacity: 0.95,
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

      {/* WAVY LINE - Speed data for activities or workout steps for planned */}
      {(isActivity || isPlanned) && (
        <g transform={`translate(28,${isMonthView ? 200 : 250})`}>
          <path
            d={generateWavyLinePath(304, 36, isActivity ? 'speed' : 'steps')}
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
