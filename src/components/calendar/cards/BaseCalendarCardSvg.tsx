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
  // Semantic elevation fields
  planContext?: string; // e.g. "Week 6 · Marathon Build"
  intentText?: string; // narrative WHY (≤120 chars)
  executionSummary?: string; // 1-line outcome judgment
  coachInsight?: {
    text: string;
    tone: 'warning' | 'encouragement' | 'neutral';
  };
  /** Mobile breakpoint flag - when true, uses stacked layout */
  isMobile?: boolean;
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

/**
 * Determines if coach insight should be shown (week view, completed only)
 * Aggressively gated to prevent over-rendering
 * 
 * Shows only when:
 * - Card is a completed activity (isActivity === true)
 * - Coach insight text exists (coachInsight?.text is truthy)
 * 
 * Note: Coach insight is optional - not all completed activities will have coach notes.
 * This is why it's conditionally rendered rather than always shown.
 */
function shouldShowCoachInsight(props: BaseCardProps): boolean {
  // Show coach insight for both planned (pre-workout guidance) and completed (post-workout analysis) sessions
  return Boolean(props.coachInsight?.text);
}

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
  isActivity = false,
  metricsLabel,
  metricsValue,
  planContext,
  intentText,
  executionSummary,
  coachInsight,
  isMobile = false,
}: BaseCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant] ?? CALENDAR_CARD_THEMES['completed-running'];
  const isMonthView = viewVariant === 'month';
  const isWeekView = viewVariant === 'week';

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

  // Accent line position (used in both week and other views)
  const accentY = height - paddingY - 4;

  // Unique ID for gradients (needed before early return)
  const id = `calendar-card-${variant}-${Math.random().toString(36).slice(2, 8)}`;

  // Canonical card structure: HEADER → META → BODY → FOOTER
  // Week view is the baseline. Month = week minus BODY. Mobile = week stacked.
  
  // Unified layout calculation (used for both week and month views)
  const hasPlanContext = Boolean(planContext);
  
  // PlanContext: above title, no spacing above, small spacing below
  const planContextHeight = 10 * textScale; // Font size 9 * textScale with line height
  const planContextSpacing = 4 * textScale; // Small spacing below planContext (gap to title)
  
  // PlanContext Y position: top of foreignObject
  // Positioned above titleY by planContext height + spacing
  const planContextY = hasPlanContext ? titleY - planContextHeight - planContextSpacing : titleY;
  
  // Title: use original titleY (planContext sits above it, doesn't push it down)
  const adjustedTitleY = titleY;
  const titleBottom = adjustedTitleY + 18 * textScale; // Title height
  
  // Meta row: 4-6px spacing from title (tighter for month view, more on mobile)
  const metaSpacing = isMonthView ? 3 * textScale : isMobile ? 8 * textScale : 5 * textScale;
  const metaLabelY = titleBottom + metaSpacing;
  const metaValueY = metaLabelY + 10 * textScale;
  const metaBottom = metaValueY + 4 * textScale;
  
  // BODY visibility: month view hides BODY entirely
  const shouldShowBody = !isMonthView;
  
  // Intent/Execution: 6-8px spacing from meta (only if BODY is shown, more on mobile)
  const semanticSpacing = shouldShowBody ? (isMobile ? 10 * textScale : 7 * textScale) : 0;
  const semanticY = shouldShowBody ? metaBottom + semanticSpacing : metaBottom;
  
  // Unplanned completed detection: isActivity && !isPlanned
  const isUnplannedCompleted = isActivity && !isPlanned;
  
  // Unplanned label: above execution, small spacing
  const unplannedLabelHeight = 10 * textScale; // Small label height
  const unplannedLabelSpacing = 4 * textScale; // Spacing below label
  const unplannedLabelY = isUnplannedCompleted ? semanticY : semanticY;
  
  // Execution: adjust position if unplanned label exists
  const executionY = isUnplannedCompleted 
    ? semanticY + unplannedLabelHeight + unplannedLabelSpacing 
    : semanticY;
  
  // Coach Insight: for both planned (pre-workout) and completed (post-workout) sessions
  // On mobile: only show if hero (this is handled by shouldShowCoachInsight logic)
  const showCoach = shouldShowBody && shouldShowCoachInsight({
    isActivity,
    coachInsight,
  } as BaseCardProps);
  // Execution foreignObject: y = executionY - 12*textScale, height = 18*textScale
  // Execution bottom = executionY - 12*textScale + 18*textScale = executionY + 6*textScale
  const executionBottom = isActivity && executionSummary ? executionY + 6 * textScale : executionY;
  const coachSpacing = 6 * textScale; // Spacing between execution and coach
  const coachY = executionBottom + (showCoach ? coachSpacing : 0);
  
  // Store for rendering
  const layout = {
    planContextY,
    titleY: adjustedTitleY,
    metaLabelY,
    metaValueY,
    semanticY,
    unplannedLabelY,
    executionY,
    coachY,
  };
    
  // Render canonical card with semantic slots
  // Week view = full card, Month view = Header + Meta only (BODY hidden)
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

      {/* HEADER */}
      {/* Type label - small caps */}
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

      {/* Duration - right aligned */}
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

      {/* PlanContext (above title, if present) */}
      {planContext && (
        <foreignObject
          x={paddingX}
          y={layout.planContextY}
          width={width - paddingX * 2}
          height={10 * textScale}
        >
          <div
            style={{
              color: COLORS.textMuted,
              fontSize: `${9 * textScale}px`,
              fontWeight: 400,
              letterSpacing: '0.02em',
              opacity: 0.575,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {planContext}
          </div>
        </foreignObject>
      )}

      {/* Title */}
      <foreignObject
        x={paddingX}
        y={layout.titleY - 18 * textScale}
        width={width - paddingX * 2}
        height={36 * textScale}
      >
        <div
          style={{
            color: COLORS.textPrimary,
            fontSize: `${18 * textScale}px`,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {displayTitle}
        </div>
      </foreignObject>

      {/* META */}
      {/* Meta row (time · distance · pace) */}
      {metricsValue && (
        <>
          <text
            x={paddingX}
            y={layout.metaLabelY}
            fill={COLORS.textMuted}
            fontSize={10 * textScale}
            fontWeight={500}
            letterSpacing="0.05em"
          >
            {metricsLabel || ''}
          </text>
          <text
            x={paddingX}
            y={layout.metaValueY}
            fill={COLORS.textSecondary}
            fontSize={13 * textScale}
            fontWeight={500}
          >
            {metricsValue}
          </text>
        </>
      )}

      {/* BODY */}
      {/* Month view: BODY is hidden entirely (shouldShowBody === false) */}
      {shouldShowBody && (
        <>
          {/* Intent (planned) - 2 lines max on mobile */}
          {isPlanned && intentText && (
            <foreignObject
              x={paddingX}
              y={layout.semanticY - 12 * textScale}
              width={width - paddingX * 2}
              height={36 * textScale}
            >
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: `${12 * textScale}px`,
                  lineHeight: 1.4,
                  opacity: 0.8,
                  fontStyle: 'italic',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {intentText}
              </div>
            </foreignObject>
          )}

          {/* Unplanned label (above execution, completed only) */}
          {isUnplannedCompleted && (
            <text
              x={paddingX}
              y={layout.unplannedLabelY}
              fill={COLORS.textMuted}
              fontSize={9 * textScale}
              fontWeight={500}
              letterSpacing="0.08em"
              opacity={0.6}
            >
              UNPLANNED ACTIVITY
            </text>
          )}

          {/* Execution Summary (completed only) */}
          {isActivity && executionSummary && (
            <foreignObject
              x={paddingX}
              y={layout.executionY - 12 * textScale}
              width={width - paddingX * 2}
              height={18 * textScale}
            >
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: `${12 * textScale}px`,
                  lineHeight: 1.4,
                  opacity: 0.75,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {executionSummary}
              </div>
            </foreignObject>
          )}

          {/* Coach Insight (completed only, after execution) - only if hero on mobile */}
          {showCoach && coachInsight && (
            <foreignObject
              x={paddingX}
              y={layout.coachY - 12 * textScale}
              width={width - paddingX * 2}
              height={36 * textScale}
            >
              <div
                style={{
                  color: COLORS.textSecondary,
                  fontSize: `${12 * textScale}px`,
                  lineHeight: 1.4,
                  opacity: coachInsight.tone === 'warning' ? 0.7 : coachInsight.tone === 'encouragement' ? 0.65 : 0.68,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {coachInsight.text}
              </div>
            </foreignObject>
          )}
        </>
      )}

      {/* FOOTER */}
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

      {/* Bottom baseline */}
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
