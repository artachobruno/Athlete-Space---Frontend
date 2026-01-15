/**
 * WorkoutCardSVG
 * 
 * Pure SVG renderer for workout cards.
 * No calendar logic - only presentation.
 */

import type { WorkoutCardVariant, WorkoutCardData } from './types';
import { CARD_THEMES } from './variants';

interface WorkoutCardSVGProps {
  variant: WorkoutCardVariant;
  data: WorkoutCardData;
  width?: number;
  height?: number;
}

export function WorkoutCardSVG({
  variant,
  data,
  width = 200,
  height = 130,
}: WorkoutCardSVGProps) {
  const theme = CARD_THEMES[variant];
  const showSparkline = theme.sparkline && data.sparkline && data.sparkline.length > 0;
  
  // Sparkline dimensions
  const sparklineWidth = width - 24;
  const sparklineHeight = 24;
  const sparklineX = 12;
  const sparklineY = height - 36;
  
  // Generate sparkline path
  const sparklinePath = showSparkline && data.sparkline
    ? generateSparklinePath(data.sparkline, sparklineWidth, sparklineHeight)
    : null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect
        width={width}
        height={height}
        rx="12"
        fill={theme.bg}
      />
      
      {/* Content */}
      <g>
        {/* Title */}
        <text
          x={12}
          y={20}
          fontSize="12"
          fontWeight="600"
          fill={theme.accent}
          className="font-sans"
        >
          {truncateText(data.title, width - 24, 12)}
        </text>
        
        {/* Workout Type */}
        <text
          x={12}
          y={38}
          fontSize="10"
          fill={theme.accent}
          opacity={0.8}
          className="font-sans"
        >
          {data.workoutType}
        </text>
        
        {/* Metrics Row */}
        <g transform={`translate(12, ${height - 60})`}>
          <text
            x={0}
            y={0}
            fontSize="11"
            fontWeight="500"
            fill={theme.accent}
            className="font-sans"
          >
            {data.duration}
          </text>
          
          {data.distance && (
            <text
              x={60}
              y={0}
              fontSize="11"
              fill={theme.accent}
              opacity={0.9}
              className="font-sans"
            >
              {data.distance}
            </text>
          )}
          
          {theme.showPace && data.pace && (
            <text
              x={data.distance ? 120 : 60}
              y={0}
              fontSize="11"
              fill={theme.accent}
              opacity={0.9}
              className="font-sans"
            >
              {data.pace}
            </text>
          )}
        </g>
        
        {/* Sparkline */}
        {showSparkline && sparklinePath && (
          <g>
            <path
              d={sparklinePath}
              fill="none"
              stroke={theme.accent}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
            {/* Sparkline area fill */}
            <path
              d={`${sparklinePath} L ${sparklineX + sparklineWidth} ${sparklineY + sparklineHeight} L ${sparklineX} ${sparklineY + sparklineHeight} Z`}
              fill={theme.accent}
              opacity={0.15}
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
    const x = i * stepX;
    // Invert Y (SVG Y increases downward, but we want higher values at top)
    const y = height - (data[i] * height);
    points.push(`${x},${y}`);
  }
  
  return `M ${points.join(' L ')}`;
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
