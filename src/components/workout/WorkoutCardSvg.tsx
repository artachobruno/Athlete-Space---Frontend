import { useId, useMemo, useEffect, useState } from 'react';
import type { Ref } from 'react';
import { normalizeRoutePoints } from '@/lib/route-utils';

export type WorkoutCardVariant = 'feed' | 'mobile' | 'share';

const VARIANT_SIZES: Record<WorkoutCardVariant, { width: number; height: number }> = {
  feed: { width: 600, height: 360 },
  mobile: { width: 320, height: 220 },
  share: { width: 1200, height: 630 },
};

const BASE_WIDTH = 420;
const BASE_HEIGHT = 260;

type RoutePoint = { x: number; y: number };

export interface WorkoutCardSvgProps {
  title: string;
  distance?: string | null;
  time?: string | null;
  pace?: string | null;
  typeLabel?: string | null;
  tss?: string | number | null;
  routePoints?: Array<[number, number]> | null;
  paceStream?: (number | null)[] | null;
  elevationStream?: number[] | null;
  variant?: WorkoutCardVariant;
  className?: string;
  svgRef?: Ref<SVGSVGElement>;
  fontScale?: number;
}

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// Color palette - matches shadcn/Dashboard Card styling
// From index.css: .dark { --card: 220 25% 11%; --border: 220 20% 18%; --muted-foreground: 220 10% 55%; }
const COLORS = {
  card: 'hsl(220 25% 11%)',           // --card dark mode
  cardDarker: 'hsl(220 25% 8%)',      // Slightly darker for gradient
  border: 'hsl(220 20% 18%)',         // --border dark mode
  borderSubtle: 'hsl(220 20% 14%)',   // Subtle border
  textPrimary: 'hsl(0 0% 98%)',       // --foreground dark
  textSecondary: 'hsl(220 10% 55%)',  // --muted-foreground dark
  textMuted: 'hsl(220 10% 45%)',      // More muted text
  accentCool: 'hsl(217 91% 60%)',     // Blue accent
  accentWarm: 'hsl(38 92% 50%)',      // Amber accent
  accentHot: 'hsl(0 84% 60%)',        // Red accent
  positive: 'hsl(142 71% 45%)',       // Green
  negative: 'hsl(0 84% 60%)',         // Red
};

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b]
    .map((value) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0'))
    .join('')}`;

const mix = (start: number, end: number, t: number) => start + (end - start) * t;

// Intensity gradient: cool → warm → hot (telemetry style)
const getIntensityColor = (intensity: number, min: number, max: number) => {
  const t = max === min ? 0 : clamp((intensity - min) / (max - min), 0, 1);
  const cool = hexToRgb(COLORS.accentCool);
  const warm = hexToRgb(COLORS.accentWarm);
  const hot = hexToRgb(COLORS.accentHot);

  if (t <= 0.5) {
    const local = t * 2;
    return rgbToHex(
      mix(cool.r, warm.r, local),
      mix(cool.g, warm.g, local),
      mix(cool.b, warm.b, local)
    );
  }

  const local = (t - 0.5) * 2;
  return rgbToHex(
    mix(warm.r, hot.r, local),
    mix(warm.g, hot.g, local),
    mix(warm.b, hot.b, local)
  );
};

const formatValue = (value?: string | number | null, fallback = '—') => {
  if (value === null || value === undefined) return fallback;
  const text = typeof value === 'number' ? value.toString() : value;
  return text.trim().length ? text : fallback;
};

const projectRoutePoints = (
  points: Array<[number, number]>,
  mapBox: { x: number; y: number; width: number; height: number }
): RoutePoint[] => {
  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const padding = Math.min(mapBox.width, mapBox.height) * 0.1;

  const usableWidth = mapBox.width - padding * 2;
  const usableHeight = mapBox.height - padding * 2;
  const scale = Math.min(usableWidth / lngSpan, usableHeight / latSpan);

  const offsetX = mapBox.x + (mapBox.width - lngSpan * scale) / 2;
  const offsetY = mapBox.y + (mapBox.height - latSpan * scale) / 2;

  return points.map(([lat, lng]) => ({
    x: offsetX + (lng - minLng) * scale,
    y: offsetY + (maxLat - lat) * scale,
  }));
};

const buildPath = (points: RoutePoint[]) =>
  points.length
    ? `M ${points[0].x} ${points[0].y} ${points
        .slice(1)
        .map((point) => `L ${point.x} ${point.y}`)
        .join(' ')}`
    : '';

// Smooth path using quadratic bezier curves
const buildSmoothPath = (points: RoutePoint[]) => {
  if (points.length < 2) return '';
  if (points.length === 2) return buildPath(points);
  
  let d = `M ${points[0].x} ${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    const midY = (p0.y + p1.y) / 2;
    
    if (i === 0) {
      d += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`;
    } else {
      d += ` Q ${p0.x} ${p0.y} ${midX} ${midY}`;
    }
  }
  
  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  
  return d;
};

export function WorkoutCardSvg({
  title,
  distance,
  time,
  pace,
  typeLabel,
  tss,
  routePoints,
  paceStream,
  elevationStream,
  variant = 'feed',
  className,
  svgRef,
  fontScale = 1,
}: WorkoutCardSvgProps) {
  const { width, height } = VARIANT_SIZES[variant];
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
  const textScale = scale * fontScale;

  // Mount animation state
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Layout calculations - tighter spacing
  const paddingX = width * (20 / BASE_WIDTH);
  const paddingY = height * (16 / BASE_HEIGHT);
  
  // Header region
  const typeLabelY = paddingY + 10 * textScale;
  const titleY = typeLabelY + 18 * textScale;
  
  // Metrics row - positioned below title
  const metricsY = titleY + 28 * textScale;
  const metricsSpacing = width * (100 / BASE_WIDTH);
  
  // Trace region - occupies lower portion
  const traceY = height * (0.42);
  const traceHeight = height * (0.52);
  const traceWidth = width - paddingX * 2;

  const mapBox = useMemo(
    () => ({
      x: paddingX,
      y: traceY,
      width: traceWidth,
      height: traceHeight,
    }),
    [paddingX, traceY, traceWidth, traceHeight]
  );

  const normalizedRoute = useMemo(
    () => normalizeRoutePoints(routePoints),
    [routePoints]
  );

  const plottedRoute = useMemo(() => {
    if (normalizedRoute.length >= 2) {
      return projectRoutePoints(normalizedRoute, mapBox);
    }
    return [];
  }, [normalizedRoute, mapBox]);

  const smoothRoutePath = useMemo(() => buildSmoothPath(plottedRoute), [plottedRoute]);
  
  // Calculate path length for animation
  const pathLength = useMemo(() => {
    if (plottedRoute.length < 2) return 0;
    let length = 0;
    for (let i = 1; i < plottedRoute.length; i++) {
      const dx = plottedRoute[i].x - plottedRoute[i - 1].x;
      const dy = plottedRoute[i].y - plottedRoute[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  }, [plottedRoute]);

  // Intensity segments for route coloring
  const routeSegments = useMemo(() => {
    if (plottedRoute.length < 2) return [];
    const paceValues =
      paceStream?.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)) ??
      [];
    const minPace = paceValues.length ? Math.min(...paceValues) : 0;
    const maxPace = paceValues.length ? Math.max(...paceValues) : 1;

    return plottedRoute.slice(0, -1).map((point, index) => {
      const next = plottedRoute[index + 1];
      const paceIndex =
        paceStream && paceStream.length > 1
          ? Math.round((index / (plottedRoute.length - 1)) * (paceStream.length - 1))
          : null;
      const paceValue =
        paceIndex !== null && paceStream
          ? paceStream[paceIndex]
          : null;
      const color =
        typeof paceValue === 'number' && Number.isFinite(paceValue)
          ? getIntensityColor(paceValue, minPace, maxPace)
          : COLORS.accentCool;
      return {
        path: `M ${point.x} ${point.y} L ${next.x} ${next.y}`,
        color,
      };
    });
  }, [plottedRoute, paceStream]);

  // Elevation fill path
  const elevationPath = useMemo(() => {
    if (plottedRoute.length < 2) return '';
    const bottom = mapBox.y + mapBox.height;
    const smoothPath = buildSmoothPath(plottedRoute);
    const lastPoint = plottedRoute[plottedRoute.length - 1];
    const firstPoint = plottedRoute[0];
    return `${smoothPath} L ${lastPoint.x} ${bottom} L ${firstPoint.x} ${bottom} Z`;
  }, [plottedRoute, mapBox]);

  const hasElevation = elevationStream && elevationStream.length > 0;

  const rawId = useId();
  const id = `workout-${rawId.replace(/:/g, '')}`;

  // Grid pattern for trace background
  const gridSize = 16 * scale;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      ref={svgRef}
      style={{ display: 'block' }}
    >
      <defs>
        {/* Background - flat, matching Dashboard Card */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.card} />
          <stop offset="100%" stopColor={COLORS.cardDarker} />
        </linearGradient>
        
        {/* Intensity gradient for trace fill */}
        <linearGradient id={`${id}-trace-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accentCool} stopOpacity="0.15" />
          <stop offset="100%" stopColor={COLORS.cardDarker} stopOpacity="0" />
        </linearGradient>
        
        {/* Minimal glow for trace line - reduced */}
        <filter id={`${id}-glow`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={1 * scale} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        
        {/* Grid pattern */}
        <pattern id={`${id}-grid`} width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill="none"
            stroke={COLORS.borderSubtle}
            strokeWidth={0.5}
            opacity="0.3"
          />
        </pattern>
        
        {/* Clip for trace region */}
        <clipPath id={`${id}-trace-clip`}>
          <rect x={mapBox.x} y={mapBox.y} width={mapBox.width} height={mapBox.height} />
        </clipPath>
      </defs>

      {/* Background */}
      <rect x="0" y="0" width={width} height={height} rx={8 * scale} fill={`url(#${id}-bg)`} />
      
      {/* Subtle border */}
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

      {/* Type label - small caps, muted */}
      <text
        x={paddingX}
        y={typeLabelY}
        fill={COLORS.textMuted}
        fontSize={11 * textScale}
        fontWeight={500}
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.06em"
        style={{ textTransform: 'uppercase' }}
      >
        {formatValue(typeLabel)?.toUpperCase()}
      </text>

      {/* Title - primary, larger */}
      <text
        x={paddingX}
        y={titleY}
        fill={COLORS.textPrimary}
        fontSize={18 * textScale}
        fontWeight={600}
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="-0.01em"
      >
        {toTitleCase(title)}
      </text>

      {/* Metrics row - larger, more readable */}
      <g fontFamily="system-ui, -apple-system, sans-serif">
        {/* Distance */}
        <text
          x={paddingX}
          y={metricsY}
          fill={COLORS.textPrimary}
          fontSize={16 * textScale}
          fontWeight={600}
          letterSpacing="-0.01em"
        >
          {formatValue(distance)}
        </text>
        
        {/* Thin divider */}
        <line
          x1={paddingX + metricsSpacing - 20 * scale}
          y1={metricsY - 10 * textScale}
          x2={paddingX + metricsSpacing - 20 * scale}
          y2={metricsY + 4 * textScale}
          stroke={COLORS.borderSubtle}
          strokeWidth={1}
          opacity="0.5"
        />

        {/* Time */}
        <text
          x={paddingX + metricsSpacing}
          y={metricsY}
          fill={COLORS.textPrimary}
          fontSize={16 * textScale}
          fontWeight={600}
          letterSpacing="-0.01em"
        >
          {formatValue(time)}
        </text>
        
        {/* Thin divider */}
        <line
          x1={paddingX + metricsSpacing * 2 - 20 * scale}
          y1={metricsY - 10 * textScale}
          x2={paddingX + metricsSpacing * 2 - 20 * scale}
          y2={metricsY + 4 * textScale}
          stroke={COLORS.borderSubtle}
          strokeWidth={1}
          opacity="0.5"
        />

        {/* Pace */}
        <text
          x={paddingX + metricsSpacing * 2}
          y={metricsY}
          fill={COLORS.textSecondary}
          fontSize={15 * textScale}
          fontWeight={500}
          letterSpacing="-0.01em"
        >
          {formatValue(pace)}
        </text>

        {/* TSS - right aligned */}
        {tss !== null && tss !== undefined && (
          <g>
            <text
              x={width - paddingX}
              y={metricsY - 14 * textScale}
              fill={COLORS.textMuted}
              fontSize={10 * textScale}
              fontWeight={500}
              textAnchor="end"
              letterSpacing="0.08em"
            >
              TSS
            </text>
            <text
              x={width - paddingX}
              y={metricsY}
              fill={COLORS.positive}
              fontSize={18 * textScale}
              fontWeight={600}
              textAnchor="end"
              letterSpacing="-0.01em"
            >
              {formatValue(tss)}
            </text>
          </g>
        )}
      </g>

      {/* Trace region - de-emphasized, telemetry always dominates geography */}
      <g clipPath={`url(#${id}-trace-clip)`} opacity="0.6">
        {/* Subtle grid background - reduced */}
        <rect
          x={mapBox.x}
          y={mapBox.y}
          width={mapBox.width}
          height={mapBox.height}
          fill={`url(#${id}-grid)`}
          opacity="0.25"
        />
        
        {/* Single reference line - minimal */}
        <line
          x1={mapBox.x}
          y1={mapBox.y + mapBox.height * 0.5}
          x2={mapBox.x + mapBox.width}
          y2={mapBox.y + mapBox.height * 0.5}
          stroke={COLORS.borderSubtle}
          strokeWidth={0.5}
          opacity="0.2"
          strokeDasharray={`${4 * scale} ${12 * scale}`}
        />

        {/* Elevation/intensity fill - reduced */}
        {elevationPath && (
          <path
            d={elevationPath}
            fill={`url(#${id}-trace-fill)`}
            opacity={hasElevation ? 0.3 : 0.15}
          />
        )}
        
        {/* Shadow trace - minimal */}
        <path
          d={smoothRoutePath}
          fill="none"
          stroke={COLORS.cardDarker}
          strokeWidth={3 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
          transform={`translate(0, ${1 * scale})`}
        />
        
        {/* Main trace - no glow, cleaner */}
        {routeSegments.length > 0 ? (
          <g>
            {routeSegments.map((segment, index) => (
              <path
                key={`${id}-seg-${index}`}
                d={segment.path}
                fill="none"
                stroke={segment.color}
                strokeWidth={1.5 * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={mounted ? 0.8 : 0}
                style={{
                  transition: 'opacity 0.6s ease-out',
                  transitionDelay: `${index * 2}ms`,
                }}
              />
            ))}
          </g>
        ) : (
          <path
            d={smoothRoutePath}
            fill="none"
            stroke={COLORS.accentCool}
            strokeWidth={1.5 * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={mounted ? 0.7 : 0}
            strokeDasharray={pathLength}
            strokeDashoffset={mounted ? 0 : pathLength}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out, opacity 0.3s ease-out',
            }}
          />
        )}
      </g>

      {/* Start/end markers - ultra minimal */}
      {plottedRoute.length > 0 && (
        <g opacity="0.5">
          {/* Start marker - small dot only */}
          <circle
            cx={plottedRoute[0].x}
            cy={plottedRoute[0].y}
            r={2 * scale}
            fill={COLORS.positive}
            opacity={mounted ? 0.7 : 0}
            style={{ transition: 'opacity 0.4s ease-out 0.6s' }}
          />
          
          {/* End marker - small dot only */}
          <circle
            cx={plottedRoute[plottedRoute.length - 1].x}
            cy={plottedRoute[plottedRoute.length - 1].y}
            r={2 * scale}
            fill={COLORS.negative}
            opacity={mounted ? 0.7 : 0}
            style={{ transition: 'opacity 0.4s ease-out 0.7s' }}
          />
        </g>
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
