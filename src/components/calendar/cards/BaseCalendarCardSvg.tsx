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
  return Boolean(props.isActivity && props.coachInsight?.text);
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

  // Accent line position (used in both week and other views)
  const accentY = height - paddingY - 4;

  // Unique ID for gradients (needed before early return)
  const id = `calendar-card-${variant}-${Math.random().toString(36).slice(2, 8)}`;

  // Week view: Canonical text stack
  // 0. PlanContext (if present)
  // 1. Title
  // 2. Meta (time · distance · pace)
  // 3. Intent (planned) OR Execution (completed)
  const isWeekView = viewVariant === 'week';
  
  if (isWeekView) {
    // Week view layout: simplified, explicit slots
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
    
    // Meta row: 4-6px spacing from title
    const metaSpacing = 5 * textScale;
    const metaLabelY = titleBottom + metaSpacing;
    const metaValueY = metaLabelY + 10 * textScale;
    const metaBottom = metaValueY + 4 * textScale;
    
    // Intent/Execution: 6-8px spacing from meta
    const semanticSpacing = 7 * textScale;
    const semanticY = metaBottom + semanticSpacing;
    
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
    
    // Coach Insight: only for completed activities, placed after execution
    const showCoach = shouldShowCoachInsight({
      isActivity,
      coachInsight,
    } as BaseCardProps);
    // Execution foreignObject: y = executionY - 12*textScale, height = 18*textScale
    // Execution bottom = executionY - 12*textScale + 18*textScale = executionY + 6*textScale
    const executionBottom = isActivity && executionSummary ? executionY + 6 * textScale : executionY;
    const coachSpacing = 6 * textScale; // Spacing between execution and coach
    const coachY = executionBottom + (showCoach ? coachSpacing : 0);
    
    // Store for rendering
    const weekLayout = {
      planContextY,
      titleY: adjustedTitleY,
      metaLabelY,
      metaValueY,
      semanticY,
      unplannedLabelY,
      executionY,
      coachY,
    };
    
    // Render week view with explicit slots
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

        {/* SLOT 0: PlanContext (above title, if present) */}
        {planContext && (
          <foreignObject
            x={paddingX}
            y={weekLayout.planContextY}
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

        {/* SLOT 1: Title */}
        <foreignObject
          x={paddingX}
          y={weekLayout.titleY - 18 * textScale}
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

        {/* SLOT 2: Meta row (time · distance · pace) */}
        {metricsValue && (
          <>
            <text
              x={paddingX}
              y={weekLayout.metaLabelY}
              fill={COLORS.textMuted}
              fontSize={10 * textScale}
              fontWeight={500}
              letterSpacing="0.05em"
            >
              {metricsLabel || ''}
            </text>
            <text
              x={paddingX}
              y={weekLayout.metaValueY}
              fill={COLORS.textSecondary}
              fontSize={13 * textScale}
              fontWeight={500}
            >
              {metricsValue}
            </text>
          </>
        )}

        {/* SLOT 3: Intent (planned) OR Execution (completed) */}
        {isPlanned && intentText && (
          <foreignObject
            x={paddingX}
            y={weekLayout.semanticY - 12 * textScale}
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
            y={weekLayout.unplannedLabelY}
            fill={COLORS.textMuted}
            fontSize={9 * textScale}
            fontWeight={500}
            letterSpacing="0.08em"
            opacity={0.6}
          >
            UNPLANNED ACTIVITY
          </text>
        )}

        {isActivity && executionSummary && (
          <foreignObject
            x={paddingX}
            y={weekLayout.executionY - 12 * textScale}
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

        {/* SLOT 4: Coach Insight (completed only, after execution) */}
        {showCoach && coachInsight && (
          <foreignObject
            x={paddingX}
            y={weekLayout.coachY - 12 * textScale}
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

  // Month/Plan view: existing layout (unchanged for now)
  const showMetrics = metricsValue && viewVariant !== 'month';
  const metricsY = titleY + 24 * textScale;
  const metricsHeight = showMetrics ? 20 * textScale : 0;
  const metricsSpacing = showMetrics ? 8 * textScale : 0;

  // Semantic fields region
  const showIntent = intentText && !isActivity && viewVariant === 'plan';
  const showExecution = executionSummary && isActivity;
  const showCoach = coachInsight && (isActivity || viewVariant === 'plan');

  const intentY = titleY + 24 * textScale + metricsHeight + metricsSpacing;
  const executionY = intentY + (showIntent ? 18 * textScale : 0);
  const coachY = executionY + (showExecution ? 18 * textScale : 0);

  // Description region - positioned below semantic fields (fallback only)
  const descY = coachY + (showCoach ? 20 * textScale : 0);

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

      {/* Metrics - distance and pace (week/plan view only, not month) */}
      {metricsValue && viewVariant !== 'month' && (
        <>
          <text
            x={paddingX}
            y={metricsY - 4}
            fill={COLORS.textMuted}
            fontSize={10 * textScale}
            fontWeight={500}
            letterSpacing="0.05em"
          >
            {metricsLabel || ''}
          </text>
          <text
            x={paddingX}
            y={metricsY + 10 * textScale}
            fill={COLORS.textSecondary}
            fontSize={13 * textScale}
            fontWeight={500}
          >
            {metricsValue}
          </text>
        </>
      )}

      {/* Intent Text - narrative WHY (plan view only) */}
      {intentText && !isActivity && viewVariant === 'plan' && (
        <foreignObject
          x={paddingX}
          y={intentY - 12 * textScale}
          width={width - paddingX * 2}
          height={20 * textScale}
        >
          <div
            style={{
              color: COLORS.textSecondary,
              fontSize: `${12 * textScale}px`,
              lineHeight: 1.4,
              opacity: 0.8,
              fontStyle: 'italic',
            }}
          >
            {intentText}
          </div>
        </foreignObject>
      )}

      {/* Execution Summary - outcome judgment (completed only) */}
      {executionSummary && isActivity && (
        <foreignObject
          x={paddingX}
          y={executionY - 12 * textScale}
          width={width - paddingX * 2}
          height={20 * textScale}
        >
          <div
            style={{
              color: COLORS.textSecondary,
              fontSize: `${12 * textScale}px`,
              lineHeight: 1.4,
              opacity: 0.75,
            }}
          >
            {executionSummary}
          </div>
        </foreignObject>
      )}

      {/* Coach Insight - sparingly shown (hero or completed) */}
      {coachInsight && (isActivity || viewVariant === 'plan') && (
        <foreignObject
          x={paddingX}
          y={coachY - 12 * textScale}
          width={width - paddingX * 2}
          height={40 * textScale}
        >
          <div
            style={{
              color:
                coachInsight.tone === 'warning'
                  ? 'hsl(0 70% 60%)'
                  : coachInsight.tone === 'encouragement'
                    ? 'hsl(120 50% 55%)'
                    : COLORS.textSecondary,
              fontSize: `${12 * textScale}px`,
              lineHeight: 1.4,
              opacity: 0.85,
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

      {/* Description - long-form fallback only */}
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
