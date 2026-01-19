import { useId, useMemo } from 'react';
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
}

const toTitleCase = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

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

const getPaceColor = (pace: number, min: number, max: number) => {
  const t = max === min ? 0 : clamp((pace - min) / (max - min), 0, 1);
  const blue = hexToRgb('#38bdf8');
  const yellow = hexToRgb('#facc15');
  const red = hexToRgb('#ef4444');

  if (t <= 0.5) {
    const local = t * 2;
    return rgbToHex(
      mix(blue.r, yellow.r, local),
      mix(blue.g, yellow.g, local),
      mix(blue.b, yellow.b, local)
    );
  }

  const local = (t - 0.5) * 2;
  return rgbToHex(
    mix(yellow.r, red.r, local),
    mix(yellow.g, red.g, local),
    mix(yellow.b, red.b, local)
  );
};

const formatValue = (value?: string | number | null, fallback = '--') => {
  if (value === null || value === undefined) return fallback;
  const text = typeof value === 'number' ? value.toString() : value;
  return text.trim().length ? text : fallback;
};

const buildFallbackRoute = (mapBox: { x: number; y: number; width: number; height: number }) => {
  const { x, y, width, height } = mapBox;
  return [
    { x: x + width * 0.06, y: y + height * 0.67 },
    { x: x + width * 0.14, y: y + height * 0.53 },
    { x: x + width * 0.24, y: y + height * 0.6 },
    { x: x + width * 0.34, y: y + height * 0.42 },
    { x: x + width * 0.45, y: y + height * 0.5 },
    { x: x + width * 0.56, y: y + height * 0.32 },
    { x: x + width * 0.68, y: y + height * 0.4 },
    { x: x + width * 0.8, y: y + height * 0.2 },
    { x: x + width * 0.92, y: y + height * 0.28 },
  ];
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
  const padding = Math.min(mapBox.width, mapBox.height) * 0.08;

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
}: WorkoutCardSvgProps) {
  const { width, height } = VARIANT_SIZES[variant];
  const scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

  const paddingX = width * (24 / BASE_WIDTH);
  const titleY = height * (34 / BASE_HEIGHT);
  const metricsLabelY = height * (70 / BASE_HEIGHT);
  const metricsValueY = height * (90 / BASE_HEIGHT);
  const typeLabelY = height * (128 / BASE_HEIGHT);
  const typeValueY = height * (146 / BASE_HEIGHT);
  const mapY = height * (164 / BASE_HEIGHT);
  const mapHeight = height * (72 / BASE_HEIGHT);
  const mapWidth = width * (372 / BASE_WIDTH);
  const mapX = paddingX;

  const mapBox = useMemo(
    () => ({
      x: mapX,
      y: mapY,
      width: mapWidth,
      height: mapHeight,
    }),
    [mapX, mapY, mapWidth, mapHeight]
  );

  const normalizedRoute = useMemo(
    () => normalizeRoutePoints(routePoints),
    [routePoints]
  );

  const plottedRoute = useMemo(() => {
    if (normalizedRoute.length >= 2) {
      return projectRoutePoints(normalizedRoute, mapBox);
    }
    return buildFallbackRoute(mapBox);
  }, [normalizedRoute, mapBox]);

  const routePath = useMemo(() => buildPath(plottedRoute), [plottedRoute]);
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
          ? getPaceColor(paceValue, minPace, maxPace)
          : '#38bdf8';
      return {
        path: `M ${point.x} ${point.y} L ${next.x} ${next.y}`,
        color,
      };
    });
  }, [plottedRoute, paceStream]);

  const elevationOpacity = elevationStream && elevationStream.length > 0 ? 0.35 : 0.18;
  const elevationPath = useMemo(() => {
    if (plottedRoute.length < 2) return '';
    const bottom = mapBox.y + mapBox.height;
    return `${buildPath(plottedRoute)} L ${plottedRoute[plottedRoute.length - 1].x} ${bottom} L ${plottedRoute[0].x} ${bottom} Z`;
  }, [plottedRoute, mapBox]);

  const rawId = useId();
  const id = `workout-card-${rawId.replace(/:/g, '')}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id={`${id}-elevation`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.5)" />
          <stop offset="100%" stopColor="rgba(2,6,23,0)" />
        </linearGradient>
        <clipPath id={`${id}-map-clip`}>
          <rect x={mapBox.x} y={mapBox.y} width={mapBox.width} height={mapBox.height} rx={10 * scale} />
        </clipPath>
      </defs>

      <rect x="0" y="0" width={width} height={height} rx={16 * scale} fill={`url(#${id}-bg)`} />

      <text
        x={paddingX}
        y={titleY}
        fill="#e5e7eb"
        fontSize={18 * scale}
        fontWeight={600}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {toTitleCase(title)}
      </text>

      <g fontFamily="Inter, system-ui, sans-serif" fill="#cbd5f5">
        <text x={paddingX} y={metricsLabelY} fontSize={12 * scale}>
          Distance
        </text>
        <text x={paddingX} y={metricsValueY} fontSize={18 * scale} fill="#f8fafc">
          {formatValue(distance)}
        </text>

        <text x={width * (150 / BASE_WIDTH)} y={metricsLabelY} fontSize={12 * scale}>
          Time
        </text>
        <text x={width * (150 / BASE_WIDTH)} y={metricsValueY} fontSize={18 * scale} fill="#f8fafc">
          {formatValue(time)}
        </text>

        <text x={width * (300 / BASE_WIDTH)} y={metricsLabelY} fontSize={12 * scale}>
          Pace
        </text>
        <text x={width * (300 / BASE_WIDTH)} y={metricsValueY} fontSize={18 * scale} fill="#f8fafc">
          {formatValue(pace)}
        </text>
      </g>

      <g fontFamily="Inter, system-ui, sans-serif">
        <text x={paddingX} y={typeLabelY} fontSize={12 * scale} fill="#94a3b8">
          Type
        </text>
        <text x={paddingX} y={typeValueY} fontSize={14 * scale} fill="#e5e7eb">
          {formatValue(typeLabel)}
        </text>

        <text x={width * (300 / BASE_WIDTH)} y={typeLabelY} fontSize={12 * scale} fill="#94a3b8">
          TSS
        </text>
        <text x={width * (300 / BASE_WIDTH)} y={typeValueY} fontSize={16 * scale} fill="#22c55e">
          {formatValue(tss)}
        </text>
      </g>

      <rect
        x={mapBox.x}
        y={mapBox.y}
        width={mapBox.width}
        height={mapBox.height}
        rx={10 * scale}
        fill="#020617"
        stroke="#1e293b"
      />

      <g clipPath={`url(#${id}-map-clip)`}>
        {elevationPath && (
          <path d={elevationPath} fill={`url(#${id}-elevation)`} opacity={elevationOpacity} />
        )}
        <path
          d={routePath}
          fill="none"
          stroke="#1e293b"
          strokeWidth={4 * scale}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55}
        />
        {routeSegments.length > 0 ? (
          routeSegments.map((segment, index) => (
            <path
              key={`${id}-segment-${index}`}
              d={segment.path}
              fill="none"
              stroke={segment.color}
              strokeWidth={3 * scale}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))
        ) : (
          <path
            d={routePath}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={3 * scale}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </g>

      {plottedRoute.length > 0 && (
        <>
          <circle cx={plottedRoute[0].x} cy={plottedRoute[0].y} r={4 * scale} fill="#22c55e" />
          <circle
            cx={plottedRoute[plottedRoute.length - 1].x}
            cy={plottedRoute[plottedRoute.length - 1].y}
            r={4 * scale}
            fill="#ef4444"
          />
        </>
      )}
    </svg>
  );
}
