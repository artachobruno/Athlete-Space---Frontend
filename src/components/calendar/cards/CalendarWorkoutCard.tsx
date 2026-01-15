/**
 * CalendarWorkoutCard
 * 
 * Pure SVG renderer for calendar workout cards.
 * NO React state, NO calendar logic, NO Tailwind classes inside SVG.
 * Optimized for small calendar density.
 */

import { CALENDAR_CARD_THEMES } from './calendarCardThemes';
import type { CalendarCardProps } from './calendarCardAdapter';

interface CalendarWorkoutCardProps extends CalendarCardProps {
  width?: number;
  height?: number;
}

export function CalendarWorkoutCard({
  variant,
  duration,
  workoutType,
  title,
  distance,
  pace,
  sparkline,
  width = 200,
  height = 130,
}: CalendarWorkoutCardProps) {
  const theme = CALENDAR_CARD_THEMES[variant] || CALENDAR_CARD_THEMES['planned-running'];
  const showSparkline = theme.showSparkline && sparkline && sparkline.length > 0;
  
  // Sparkline dimensions
  const sparklineWidth = width - 24;
  const sparklineHeight = 20;
  const sparklineX = 12;
  const sparklineY = height - 32;
  
  // Generate sparkline path
  const sparklinePath = showSparkline && sparkline
    ? generateSparklinePath(sparkline, sparklineWidth, sparklineHeight)
    : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Subtle shadow */}
        <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="1" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background */}
      <rect
        width={width}
        height={height}
        rx="16"
        fill={theme.base}
        filter="url(#cardShadow)"
      />
      
      {/* Content */}
      <g>
        {/* Title - Large, high contrast */}
        <text
          x={12}
          y={22}
          fontSize="13"
          fontWeight="600"
          fill={theme.text}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {truncateText(title, width - 24, 13)}
        </text>
        
        {/* Workout Type */}
        <text
          x={12}
          y={40}
          fontSize="10"
          fill={theme.secondary}
          opacity={0.9}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {workoutType}
        </text>
        
        {/* Metrics Row - Clear hierarchy */}
        <g transform={`translate(12, ${height - 50})`}>
          <text
            x={0}
            y={0}
            fontSize="12"
            fontWeight="600"
            fill={theme.text}
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            {duration}
          </text>
          
          {distance && (
            <text
              x={50}
              y={0}
              fontSize="11"
              fill={theme.secondary}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {distance}
            </text>
          )}
          
          {theme.showPace && pace && (
            <text
              x={distance ? 110 : 50}
              y={0}
              fontSize="11"
              fill={theme.secondary}
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {pace}
            </text>
          )}
        </g>
        
        {/* Sparkline - Only for completed activities */}
        {showSparkline && sparklinePath && (
          <g>
            <path
              d={sparklinePath}
              fill="none"
              stroke={theme.sparkline}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Sparkline area fill */}
            <path
              d={`${sparklinePath} L ${sparklineX + sparklineWidth} ${sparklineY + sparklineHeight} L ${sparklineX} ${sparklineY + sparklineHeight} Z`}
              fill={theme.sparkline}
              opacity={0.2}
            />
          </g>
        )}
      </g>
    </svg>
  );
}

/**
 * Generates SVG path for sparkline from normalized data (0-1)
 */
function generateSparklinePath(data: number[], width: number, height: number): string {
  if (data.length === 0) return '';
  
  const stepX = width / (data.length - 1 || 1);
  const points: string[] = [];
  
  for (let i = 0; i < data.length; i++) {
    const x = 12 + i * stepX;
    // Invert Y (SVG Y increases downward, but we want higher values at top)
    const y = height - 32 - (data[i] * height);
    if (i === 0) {
      points.push(`M ${x},${y}`);
    } else {
      points.push(`L ${x},${y}`);
    }
  }
  
  return points.join(' ');
}

/**
 * Truncates text to fit within width
 */
function truncateText(text: string, maxWidth: number, fontSize: number): string {
  // Rough estimation: average character width is ~0.6 * fontSize
  const avgCharWidth = fontSize * 0.6;
  const maxChars = Math.floor(maxWidth / avgCharWidth);
  
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 3) + '...';
}
