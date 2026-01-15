import { CALENDAR_CARD_THEMES } from './calendarCardThemes';
import type { CalendarCardProps } from './calendarCardAdapter';

export function CalendarWorkoutCard({
  variant,
  duration,
  workoutType,
  title,
  pace,
  sparkline,
  coachNote,
}: CalendarCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant];
  const showSparkline = theme.showSparkline && sparkline?.length;

  const noteColor =
    coachNote?.tone === 'warning'
      ? '#F59E0B'
      : coachNote?.tone === 'encouragement'
      ? '#22C55E'
      : '#93C5FD';

  return (
    <svg viewBox="0 0 360 460" width="100%" height="100%">
      <rect width="360" height="460" rx="16" fill={theme.base} />

      {/* Title */}
      <text x="18" y="32" fontSize="16" fontWeight="600" fill={theme.text}>
        {title}
      </text>

      {/* Workout type */}
      <text x="18" y="52" fontSize="12" fill={theme.secondary}>
        {workoutType}
      </text>

      {/* Coach note */}
      {coachNote && (
        <g transform="translate(18, 70)">
          <rect width="324" height="22" rx="8" fill={noteColor} opacity="0.18" />
          <text x="10" y="15" fontSize="12" fill={theme.text}>
            {coachNote.text}
          </text>
        </g>
      )}

      {/* Metrics */}
      <text x="18" y="430" fontSize="14" fontWeight="600" fill={theme.text}>
        {duration}
      </text>

      {pace && (
        <text x="90" y="430" fontSize="13" fill={theme.secondary}>
          {pace}
        </text>
      )}

      {/* Sparkline */}
      {showSparkline && (
        <polyline
          points={sparkline!
            .map((v, i) => `${18 + i * 16},${440 - v * 24}`)
            .join(' ')}
          fill="none"
          stroke={theme.sparkline}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
