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

// Telemetry color palette - muted, instrumentation-style
const COLORS = {
  void: '#0a0c10',
  surface: '#0d1017',
  border: '#1a1f2a',
  borderSubtle: '#141820',
  textPrimary: '#e8eaed',
  textSecondary: '#7a8494',
  textMuted: '#4a5260',
  accentCool: '#3b82f6',
  accentWarm: '#f59e0b',
  accentHot: '#dc2626',
  positive: '#10b981',
  negative: '#ef4444',
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
        {/* Background gradient - subtle depth */}
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.surface} />
          <stop offset="100%" stopColor={COLORS.void} />
        </linearGradient>
        
        {/* Intensity gradient for trace fill */}
        <linearGradient id={`${id}-trace-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accentCool} stopOpacity="0.15" />
          <stop offset="100%" stopColor={COLORS.void} stopOpacity="0" />
        </linearGradient>
        
        {/* Subtle glow for trace line */}
        <filter id={`${id}-glow`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={2 * scale} result="blur" />
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
        fontSize={9 * textScale}
        fontWeight={500}
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="0.08em"
        style={{ textTransform: 'uppercase' }}
      >
        {formatValue(typeLabel)?.toUpperCase()}
      </text>

      {/* Title - primary, concise */}
      <text
        x={paddingX}
        y={titleY}
        fill={COLORS.textPrimary}
        fontSize={15 * textScale}
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
        letterSpacing="-0.01em"
      >
        {toTitleCase(title)}
      </text>

      {/* Metrics row - telemetry style */}
      <g fontFamily="Inter, system-ui, sans-serif">
        {/* Distance */}
        <text
          x={paddingX}
          y={metricsY}
          fill={COLORS.textPrimary}
          fontSize={14 * textScale}
          fontWeight={600}
          letterSpacing="-0.02em"
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
          fontSize={14 * textScale}
          fontWeight={600}
          letterSpacing="-0.02em"
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
          fontSize={13 * textScale}
          fontWeight={500}
          letterSpacing="-0.01em"
        >
          {formatValue(pace)}
        </text>

        {/* TSS - right aligned, accent color for high values */}
        {tss !== null && tss !== undefined && (
          <g>
            <text
              x={width - paddingX}
              y={metricsY - 14 * textScale}
              fill={COLORS.textMuted}
              fontSize={8 * textScale}
              fontWeight={500}
              textAnchor="end"
              letterSpacing="0.1em"
            >
              TSS
            </text>
            <text
              x={width - paddingX}
              y={metricsY}
              fill={COLORS.positive}
              fontSize={16 * textScale}
              fontWeight={700}
              textAnchor="end"
              letterSpacing="-0.02em"
            >
              {formatValue(tss)}
            </text>
          </g>
        )}
      </g>

      {/* Trace region */}
      <g clipPath={`url(#${id}-trace-clip)`}>
        {/* Subtle grid background */}
        <rect
          x={mapBox.x}
          y={mapBox.y}
          width={mapBox.width}
          height={mapBox.height}
          fill={`url(#${id}-grid)`}
          opacity="0.4"
        />
        
        {/* Horizontal reference lines */}
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1={mapBox.x}
            y1={mapBox.y + mapBox.height * ratio}
            x2={mapBox.x + mapBox.width}
            y2={mapBox.y + mapBox.height * ratio}
            stroke={COLORS.borderSubtle}
            strokeWidth={0.5}
            opacity="0.3"
            strokeDasharray={`${4 * scale} ${8 * scale}`}
          />
        ))}

        {/* Elevation/intensity fill */}
        {elevationPath && (
          <path
            d={elevationPath}
            fill={`url(#${id}-trace-fill)`}
            opacity={hasElevation ? 0.6 : 0.3}
          />
        )}
        
        {/* Shadow trace - subtle depth */}
        <path
          d={smoothRoutePath}
          fill="none"
          stroke={COLORS.void}
          strokeWidth={4 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
          transform={`translate(0, ${2 * scale})`}
        />
        
        {/* Main trace with intensity coloring */}
        {routeSegments.length > 0 ? (
          <g filter={`url(#${id}-glow)`}>
            {routeSegments.map((segment, index) => (
              <path
                key={`${id}-seg-${index}`}
                d={segment.path}
                fill="none"
                stroke={segment.color}
                strokeWidth={2 * scale}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={mounted ? 1 : 0}
                style={{
                  transition: 'opacity 0.8s ease-out',
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
            strokeWidth={2 * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${id}-glow)`}
            opacity={mounted ? 0.9 : 0}
            strokeDasharray={pathLength}
            strokeDashoffset={mounted ? 0 : pathLength}
            style={{
              transition: 'stroke-dashoffset 1.2s ease-out, opacity 0.4s ease-out',
            }}
          />
        )}
      </g>

      {/* Start/end markers - minimal */}
      {plottedRoute.length > 0 && (
        <>
          {/* Start marker */}
          <circle
            cx={plottedRoute[0].x}
            cy={plottedRoute[0].y}
            r={3 * scale}
            fill={COLORS.positive}
            opacity={mounted ? 1 : 0}
            style={{ transition: 'opacity 0.5s ease-out 0.8s' }}
          />
          <circle
            cx={plottedRoute[0].x}
            cy={plottedRoute[0].y}
            r={6 * scale}
            fill="none"
            stroke={COLORS.positive}
            strokeWidth={1}
            opacity={mounted ? 0.3 : 0}
            style={{ transition: 'opacity 0.5s ease-out 0.8s' }}
          />
          
          {/* End marker */}
          <circle
            cx={plottedRoute[plottedRoute.length - 1].x}
            cy={plottedRoute[plottedRoute.length - 1].y}
            r={3 * scale}
            fill={COLORS.negative}
            opacity={mounted ? 1 : 0}
            style={{ transition: 'opacity 0.5s ease-out 1s' }}
          />
          <circle
            cx={plottedRoute[plottedRoute.length - 1].x}
            cy={plottedRoute[plottedRoute.length - 1].y}
            r={6 * scale}
            fill="none"
            stroke={COLORS.negative}
            strokeWidth={1}
            opacity={mounted ? 0.3 : 0}
            style={{ transition: 'opacity 0.5s ease-out 1s' }}
          />
        </>
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
