import { useEffect, useRef } from 'react';

interface TelemetrySparklineSvgProps {
  /** Normalized values 0-1 */
  data: number[];
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Stroke color - defaults to accent blue */
  stroke?: string;
  /** Show intensity gradient based on value changes */
  showIntensity?: boolean;
  className?: string;
}

/**
 * Lap-delta style sparkline trace.
 * Animates stroke once on mount, then remains static.
 */
export const TelemetrySparklineSvg = ({
  data,
  width = 120,
  height = 32,
  stroke = 'hsl(210, 100%, 60%)',
  showIntensity = false,
  className = '',
}: TelemetrySparklineSvgProps) => {
  const pathRef = useRef<SVGPathElement>(null);

  // Generate path from normalized data
  const generatePath = (): string => {
    if (!data.length) return '';
    
    const padding = 2;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const step = usableWidth / (data.length - 1 || 1);

    return data
      .map((v, i) => {
        const x = padding + i * step;
        const y = padding + usableHeight - v * usableHeight;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const pathData = generatePath();

  // Single mount animation - draw stroke
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !pathData) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    // Animate once
    const animation = path.animate(
      [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
      { duration: 600, easing: 'ease-out', fill: 'forwards' }
    );

    return () => animation.cancel();
  }, [pathData]);

  const gradientId = `sparkline-intensity-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ overflow: 'visible' }}
    >
      {showIntensity && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(210, 100%, 50%)" stopOpacity="0.4" />
            <stop offset="50%" stopColor="hsl(160, 80%, 45%)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="hsl(210, 100%, 60%)" stopOpacity="0.6" />
          </linearGradient>
        </defs>
      )}

      {/* Reference baseline - subtle */}
      <line
        x1="2"
        y1={height / 2}
        x2={width - 2}
        y2={height / 2}
        stroke="hsl(215, 20%, 25%)"
        strokeWidth="0.5"
        strokeDasharray="2 4"
      />

      {/* Main trace */}
      <path
        ref={pathRef}
        d={pathData}
        fill="none"
        stroke={showIntensity ? `url(#${gradientId})` : stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
