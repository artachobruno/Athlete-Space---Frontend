import { useEffect, useRef } from 'react';

interface DeltaIndicatorSvgProps {
  /** Delta value: positive = improvement, negative = regression */
  delta: number;
  /** Maximum expected delta for scaling */
  maxDelta?: number;
  /** Size in px (square) */
  size?: number;
  /** Orientation: 'vertical' for up/down, 'horizontal' for left/right */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

/**
 * Delta indicator - lap delta style.
 * Arrow direction and fill encode improvement/regression.
 */
export const DeltaIndicatorSvg = ({
  delta,
  maxDelta = 1,
  size = 24,
  orientation = 'vertical',
  className = '',
}: DeltaIndicatorSvgProps) => {
  const arrowRef = useRef<SVGPathElement>(null);
  
  // Normalize delta for visual scaling
  const normalizedDelta = Math.max(-1, Math.min(1, delta / maxDelta));
  const isPositive = delta > 0;
  const isNeutral = Math.abs(delta) < 0.01;
  
  // Color based on delta direction
  const getColor = () => {
    if (isNeutral) return 'hsl(215, 20%, 40%)';
    if (isPositive) return 'hsl(160, 80%, 45%)'; // Improvement - green
    return 'hsl(0, 70%, 55%)'; // Regression - red
  };

  // Generate arrow path based on orientation and direction
  const generateArrowPath = (): string => {
    const center = size / 2;
    const arrowSize = size * 0.35;
    const stemWidth = size * 0.12;
    
    if (isNeutral) {
      // Neutral: horizontal bar
      return `M ${center - arrowSize} ${center} L ${center + arrowSize} ${center}`;
    }

    if (orientation === 'vertical') {
      // Up arrow (positive) or down arrow (negative)
      const tipY = isPositive ? center - arrowSize : center + arrowSize;
      const baseY = isPositive ? center + arrowSize * 0.5 : center - arrowSize * 0.5;
      
      return [
        `M ${center} ${tipY}`,
        `L ${center + arrowSize * 0.6} ${center}`,
        `L ${center + stemWidth} ${center}`,
        `L ${center + stemWidth} ${baseY}`,
        `L ${center - stemWidth} ${baseY}`,
        `L ${center - stemWidth} ${center}`,
        `L ${center - arrowSize * 0.6} ${center}`,
        'Z',
      ].join(' ');
    } else {
      // Right arrow (positive) or left arrow (negative)
      const tipX = isPositive ? center + arrowSize : center - arrowSize;
      const baseX = isPositive ? center - arrowSize * 0.5 : center + arrowSize * 0.5;
      
      return [
        `M ${tipX} ${center}`,
        `L ${center} ${center - arrowSize * 0.6}`,
        `L ${center} ${center - stemWidth}`,
        `L ${baseX} ${center - stemWidth}`,
        `L ${baseX} ${center + stemWidth}`,
        `L ${center} ${center + stemWidth}`,
        `L ${center} ${center + arrowSize * 0.6}`,
        'Z',
      ].join(' ');
    }
  };

  const arrowPath = generateArrowPath();

  // Animate opacity and slight position on mount
  useEffect(() => {
    const arrow = arrowRef.current;
    if (!arrow) return;

    const translateOffset = isNeutral ? 0 : orientation === 'vertical' 
      ? (isPositive ? 3 : -3) 
      : (isPositive ? 3 : -3);
    
    const translateProp = orientation === 'vertical' ? 'translateY' : 'translateX';

    arrow.animate(
      [
        { opacity: 0, transform: `${translateProp}(${translateOffset}px)` },
        { opacity: 1, transform: `${translateProp}(0)` },
      ],
      { duration: 300, easing: 'ease-out', fill: 'forwards' }
    );
  }, [delta, isPositive, isNeutral, orientation]);

  // Opacity based on delta magnitude
  const opacity = isNeutral ? 0.4 : 0.5 + Math.abs(normalizedDelta) * 0.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      {/* Subtle reference circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size * 0.42}
        fill="none"
        stroke="hsl(215, 20%, 20%)"
        strokeWidth="0.5"
      />

      {/* Delta arrow */}
      <path
        ref={arrowRef}
        d={arrowPath}
        fill={isNeutral ? 'none' : getColor()}
        stroke={isNeutral ? getColor() : 'none'}
        strokeWidth={isNeutral ? 1.5 : 0}
        fillOpacity={opacity}
        strokeLinecap="round"
      />
    </svg>
  );
};
