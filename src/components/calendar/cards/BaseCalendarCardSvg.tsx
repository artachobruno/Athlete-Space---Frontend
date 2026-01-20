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

// Telemetry color palette
const COLORS = {
  grid: 'rgba(148, 163, 184, 0.04)',
  border: 'rgba(148, 163, 184, 0.08)',
  trace: 'rgba(56, 189, 248, 0.6)',
  traceDim: 'rgba(56, 189, 248, 0.2)',
};

// Generate telemetry-style signal trace path
function generateTelemetryTrace(
  width: number,
  height: number,
  type: 'speed' | 'steps',
  seed: number = 0
): string {
  const points = 60;
  const step = width / (points - 1);
  const midHeight = height / 2;
  const amplitude = height * 0.35;
  
  const pathPoints: string[] = [];
  
  for (let i = 0; i < points; i++) {
    const x = i * step;
    let y: number;
    
    if (type === 'speed') {
      // Speed: smooth variations simulating pace changes
      const baseWave = Math.sin((i / points) * Math.PI * 3 + seed) * amplitude * 0.6;
      const micro = Math.sin((i / points) * Math.PI * 12 + seed * 2) * amplitude * 0.15;
      const trend = Math.sin((i / points) * Math.PI * 1.5) * amplitude * 0.25;
      y = midHeight + baseWave + micro + trend;
    } else {
      // Steps: more segmented pattern with plateaus
      const segment = Math.floor(i / (points / 8));
      const segmentBase = Math.sin((segment / 8) * Math.PI * 2 + seed) * amplitude * 0.7;
      const stepNoise = Math.sin((i / points) * Math.PI * 16) * amplitude * 0.1;
      y = midHeight + segmentBase + stepNoise;
    }
    
    // Clamp to bounds
    y = Math.max(2, Math.min(height - 2, y));
    
    pathPoints.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  
  return pathPoints.join(' ');
}

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
  const gridSize = 16;

  // Generate seed from title for consistent trace per session
  const traceSeed = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 100;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 360 ${viewBoxHeight}`}
      preserveAspectRatio={isMonthView ? 'none' : 'xMidYMid meet'}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        fontFamily: 'SF Mono, Monaco, Consolas, system-ui, -apple-system, sans-serif',
      }}
    >
      <defs>
        {/* Background gradient - darker, flatter */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.base} stopOpacity="0.95" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.85" />
        </linearGradient>

        {/* Subtle inner edge highlight */}
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
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

        {/* Trace gradient */}
        <linearGradient id={`${id}-trace`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={theme.sparkline} stopOpacity="0.3" />
          <stop offset="50%" stopColor={theme.sparkline} stopOpacity="0.7" />
          <stop offset="100%" stopColor={theme.sparkline} stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* Background - flat, no liquid glass effects */}
      <rect width="360" height={viewBoxHeight} rx="12" fill={`url(#${id}-bg)`} />
      <rect width="360" height={viewBoxHeight} rx="12" fill={`url(#${id}-grid)`} />
      
      {/* Border - thin, subtle */}
      <rect 
        x="0.5" 
        y="0.5" 
        width="359" 
        height={viewBoxHeight - 1} 
        rx="11.5" 
        fill="none" 
        stroke={COLORS.border} 
        strokeWidth="0.5" 
      />
      
      {/* Top edge highlight */}
      <rect 
        x="1" 
        y="1" 
        width="358" 
        height={viewBoxHeight - 2} 
        rx="11" 
        fill="none" 
        stroke={`url(#${id}-edge)`} 
        strokeWidth="1" 
      />

      {/* TOP ROW - metrics style */}
      <text 
        x="20" 
        y="32" 
        fill={theme.text} 
        fontSize={topRowFontSize} 
        fontWeight="600"
        letterSpacing="-0.02em"
      >
        {topLeft}
      </text>
      <text 
        x="340" 
        y="32" 
        fill={theme.secondary} 
        fontSize={topRowFontSize - 4} 
        fontWeight="500" 
        textAnchor="end"
        opacity="0.7"
        letterSpacing="0.02em"
      >
        {topRight}
      </text>

      {/* Divider line */}
      <line x1="20" y1="44" x2="340" y2="44" stroke={COLORS.border} strokeWidth="0.5" />

      {/* METRICS - small caps labels */}
      {showMetrics && (
        <>
          <text 
            x="20" 
            y={isMonthView ? 62 : 68} 
            fill={theme.secondary} 
            fontSize={metricsLabelFontSize} 
            letterSpacing="0.12em"
            opacity="0.6"
            style={{ textTransform: 'uppercase' }}
          >
            {metricsLabel?.toUpperCase()}
          </text>
          <text 
            x="20" 
            y={isMonthView ? 82 : 92} 
            fill={theme.text} 
            fontSize={metricsValueFontSize} 
            fontWeight="500"
            letterSpacing="-0.01em"
          >
            {metricsValue}
          </text>
        </>
      )}

      {/* TITLE - tighter line height */}
      <foreignObject x="20" y={isMonthView ? 54 : 64} width="320" height={isMonthView ? 60 : 76}>
        <div
          style={{
            color: theme.text,
            fontSize: `${titleFontSize}px`,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
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
        <foreignObject x="20" y={isMonthView ? 110 : 136} width="320" height={isMonthView ? 50 : 70}>
          <div
            style={{
              color: theme.secondary,
              fontSize: `${descFontSize}px`,
              lineHeight: 1.35,
              opacity: 0.7,
              letterSpacing: '0.01em',
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

      {/* TELEMETRY TRACE - replaces wavy decorative line */}
      {(isActivity || isPlanned) && (
        <g transform={`translate(20,${isMonthView ? 200 : 300})`}>
          {/* Baseline */}
          <line 
            x1="0" 
            y1="20" 
            x2="320" 
            y2="20" 
            stroke={COLORS.border} 
            strokeWidth="0.5" 
            strokeDasharray="2,4"
          />
          
          {/* Signal trace */}
          <path
            d={generateTelemetryTrace(320, 40, isActivity ? 'speed' : 'steps', traceSeed)}
            fill="none"
            stroke={`url(#${id}-trace)`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Start marker */}
          <circle cx="0" cy="20" r="2" fill={theme.sparkline} opacity="0.5" />
          
          {/* End marker */}
          <circle cx="320" cy="20" r="2" fill={theme.sparkline} opacity="0.5" />
        </g>
      )}
    </svg>
  );
}
