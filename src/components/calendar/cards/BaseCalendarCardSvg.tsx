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

// Shared dimensions to match WorkoutCardSvg
const VARIANT_SIZES = {
  feed: { width: 600, height: 360 },
  mobile: { width: 320, height: 220 },
};

const BASE_WIDTH = 420;
const BASE_HEIGHT = 260;

// Color palette - matches WorkoutCardSvg
const COLORS = {
  border: 'hsl(220 20% 18%)',
  borderSubtle: 'hsl(220 20% 14%)',
  textPrimary: 'hsl(0 0% 98%)',
  textSecondary: 'hsl(220 10% 55%)',
  textMuted: 'hsl(220 10% 45%)',
};

export function BaseCalendarCardSvg({
  variant,
  topLeft,
  topRight,
  title,
  description,
  titleClampLines = 2,
  descClampLines = 3,
  viewVariant,
  isPlanned = false,
}: BaseCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant] ?? CALENDAR_CARD_THEMES['completed-running'];
  const isMonthView = viewVariant === 'month';

  // Use same dimensions as WorkoutCardSvg
  const { width, height } = isMonthView ? VARIANT_SIZES.mobile : VARIANT_SIZES.feed;
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const fontScale = isMonthView ? 1.2 : 1.15;
  const textScale = scale * fontScale;

  const displayTitle = toTitleCase(title);

  // Layout calculations - matching WorkoutCardSvg
  const paddingX = width * (20 / BASE_WIDTH);
  const paddingY = height * (16 / BASE_HEIGHT);

  // Header region - matching WorkoutCardSvg layout
  const typeLabelY = paddingY + 10 * textScale;
  const titleY = typeLabelY + 18 * textScale;

  // Description region - positioned below title
  const descY = titleY + 24 * textScale;

  // Accent line position
  const accentY = height - paddingY - 4;

  const id = `calendar-card-${variant}-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <defs>
        {/* Background gradient */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.base} stopOpacity="1" />
          <stop offset="100%" stopColor={theme.base} stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        rx={8 * scale}
        fill={`url(#${id}-bg)`}
      />

      {/* Border */}
      <rect
        x="0.5"
        y="0.5"
        width={width - 1}
        height={height - 1}
        rx={8 * scale}
        fill="none"
        stroke={COLORS.border}
        strokeWidth={1}
        opacity="0.5"
      />

      {/* Type label - small caps, matching WorkoutCardSvg */}
      <text
        x={paddingX}
        y={typeLabelY}
        fill={COLORS.textMuted}
        fontSize={11 * textScale}
        fontWeight={500}
        letterSpacing="0.06em"
      >
        {topLeft.toUpperCase()}
      </text>

      {/* Duration - right aligned, matching WorkoutCardSvg style */}
      <text
        x={width - paddingX}
        y={typeLabelY}
        fill={COLORS.textSecondary}
        fontSize={11 * textScale}
        fontWeight={500}
        textAnchor="end"
        letterSpacing="0.06em"
      >
        {topRight}
      </text>

      {/* Title - primary, matching WorkoutCardSvg */}
      <text
        x={paddingX}
        y={titleY}
        fill={COLORS.textPrimary}
        fontSize={18 * textScale}
        fontWeight={600}
        letterSpacing="-0.01em"
      >
        {displayTitle.length > 28 ? `${displayTitle.slice(0, 28)}...` : displayTitle}
      </text>

      {/* Description - using foreignObject for text wrapping */}
      {description && (
        <foreignObject
          x={paddingX}
          y={descY}
          width={width - paddingX * 2}
          height={height - descY - paddingY - 16}
        >
          <div
            style={{
              color: COLORS.textSecondary,
              fontSize: `${14 * textScale}px`,
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

      {/* Accent line at bottom - subtle indicator for planned */}
      {isPlanned && (
        <rect
          x={paddingX}
          y={accentY}
          width={width - paddingX * 2}
          height={3}
          rx={1.5}
          fill={theme.sparkline}
          opacity={0.3}
        />
      )}

      {/* Bottom baseline - matching WorkoutCardSvg */}
      <line
        x1={paddingX}
        y1={height - paddingY}
        x2={width - paddingX}
        y2={height - paddingY}
        stroke={COLORS.border}
        strokeWidth={1}
        opacity="0.3"
      />
    </svg>
  );
}
