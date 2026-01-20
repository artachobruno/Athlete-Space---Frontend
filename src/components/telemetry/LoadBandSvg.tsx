import { useEffect, useRef } from 'react';

interface LoadBandSvgProps {
  /** Current value 0-1 */
  value: number;
  /** Target zone start 0-1 */
  zoneStart?: number;
  /** Target zone end 0-1 */
  zoneEnd?: number;
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Whether value is in optimal zone */
  inZone?: boolean;
  className?: string;
}

/**
 * Load band indicator - similar to ERS deployment bar.
 * Shows current load position against target zone.
 */
export const LoadBandSvg = ({
  value,
  zoneStart = 0.4,
  zoneEnd = 0.7,
  width = 160,
  height = 12,
  inZone,
  className = '',
}: LoadBandSvgProps) => {
  const valueRef = useRef<SVGRectElement>(null);
  
  const padding = 1;
  const barHeight = height - padding * 2;
  const usableWidth = width - padding * 2;
  
  // Clamp value
  const clampedValue = Math.max(0, Math.min(1, value));
  const valueWidth = clampedValue * usableWidth;
  
  // Zone positions
  const zoneX = padding + zoneStart * usableWidth;
  const zoneWidth = (zoneEnd - zoneStart) * usableWidth;
  
  // Determine if in zone (auto-detect if not provided)
  const isInZone = inZone ?? (value >= zoneStart && value <= zoneEnd);
  
  // Value bar color based on zone position
  const getValueColor = () => {
    if (value < zoneStart) return 'hsl(210, 100%, 55%)'; // Below - blue
    if (value > zoneEnd) return 'hsl(0, 70%, 55%)'; // Above - red
    return 'hsl(160, 80%, 45%)'; // In zone - green
  };

  // Animate value bar on mount
  useEffect(() => {
    const bar = valueRef.current;
    if (!bar) return;

    bar.animate(
      [{ width: 0 }, { width: valueWidth }],
      { duration: 500, easing: 'ease-out', fill: 'forwards' }
    );
  }, [valueWidth]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      {/* Background track */}
      <rect
        x={padding}
        y={padding}
        width={usableWidth}
        height={barHeight}
        fill="hsl(215, 20%, 12%)"
        rx="1"
      />

      {/* Target zone indicator */}
      <rect
        x={zoneX}
        y={padding}
        width={zoneWidth}
        height={barHeight}
        fill="hsl(160, 80%, 45%)"
        fillOpacity="0.15"
        rx="1"
      />

      {/* Zone boundary marks */}
      <line
        x1={zoneX}
        y1={0}
        x2={zoneX}
        y2={height}
        stroke="hsl(160, 80%, 45%)"
        strokeWidth="0.5"
        strokeOpacity="0.5"
      />
      <line
        x1={zoneX + zoneWidth}
        y1={0}
        x2={zoneX + zoneWidth}
        y2={height}
        stroke="hsl(160, 80%, 45%)"
        strokeWidth="0.5"
        strokeOpacity="0.5"
      />

      {/* Value bar */}
      <rect
        ref={valueRef}
        x={padding}
        y={padding}
        width={0}
        height={barHeight}
        fill={getValueColor()}
        fillOpacity={isInZone ? 0.9 : 0.7}
        rx="1"
      />

      {/* Current position tick */}
      <line
        x1={padding + valueWidth}
        y1={0}
        x2={padding + valueWidth}
        y2={height}
        stroke={getValueColor()}
        strokeWidth="1.5"
        strokeOpacity="0.9"
      />
    </svg>
  );
};
