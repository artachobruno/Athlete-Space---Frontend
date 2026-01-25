import { cn } from '@/lib/utils';
import {
  CARD_BG,
  CARD_BORDER,
  CARD_INNER_HIGHLIGHT,
  CARD_INNER_SHADOW,
  CARD_NEBULA,
  CARD_GLOW,
  STELLAR_DENSITY,
  NOISE_OPACITY,
  NOISE_BLEND_MODE,
  NOISE_FALLBACK,
  scheduleThemeVars,
} from '@/styles/scheduleTheme';

/**
 * Surface role - determines visual intensity and effects
 */
export type SurfaceRole = 'ambient' | 'focus' | 'modal' | 'summary';

/**
 * Workout intent - used for star density variation
 */
export type WorkoutIntent = 'easy' | 'steady' | 'tempo' | 'intervals' | 'long' | 'rest';

/**
 * Surface configuration - centralizes all visual decisions
 */
const surfaceConfig = {
  ambient: {
    stars: 0.15,
    nebula: 0.10,
    blur: 14,
    glow: false,
  },
  focus: {
    stars: 0.35,
    nebula: 0.25,
    blur: 16,
    glow: true,
  },
  modal: {
    stars: 0.45,
    nebula: 0.35,
    blur: 18,
    glow: false,
  },
  summary: {
    stars: 0.25,
    nebula: 0.20,
    blur: 14,
    glow: false,
  },
} as const;

interface WorkoutCardShellProps {
  children: React.ReactNode;
  /** Surface role - determines visual intensity */
  role?: SurfaceRole;
  /** Workout intent - used for star density variation */
  intent?: WorkoutIntent;
  /** Additional CSS classes */
  className?: string;
  /** Padding override */
  padding?: string;
}

export function WorkoutCardShell({
  children,
  role = 'ambient',
  intent = 'easy',
  className,
  padding = 'p-3',
}: WorkoutCardShellProps) {
  const config = surfaceConfig[role];
  const stellarSize = STELLAR_DENSITY[intent] || STELLAR_DENSITY.easy;
  const hasStars = config.stars > 0;
  const hasNebula = config.nebula > 0;

  return (
    <div className={cn('relative', className)}>
      {/* Actual card */}
      <div
        className={cn(
          // Base glass card
          'relative rounded-xl',
          'shadow-sm transition-all motion-safe:duration-200',
          'border border-white/5',
          // Hover - subtle star animation
          'hover:shadow-lg group',
        )}
        style={{
          ...scheduleThemeVars,
          background: CARD_BG,
          borderColor: CARD_BORDER,
          boxShadow: CARD_INNER_SHADOW,
          backdropFilter: `blur(${config.blur}px)`,
        }}
      >
        {/* Stellar field - actual stars (SVG) + nebula mist */}
        {hasStars && (
          <div
            className="stars absolute inset-0 rounded-xl pointer-events-none"
            style={{
              backgroundImage: `url('/stars.svg'), ${hasNebula ? CARD_NEBULA : 'none'}`,
              // Modal uses cover to prevent star tiling; smaller cards use repeat
              backgroundSize: role === 'modal' ? 'cover, cover' : `${stellarSize}, cover`,
              backgroundRepeat: role === 'modal' ? 'no-repeat, no-repeat' : 'repeat, no-repeat',
              backgroundPosition: '0% 0%, 70% 50%',
              opacity: config.stars,
            }}
          />
        )}

        {/* Nebula only (if no stars but nebula enabled) */}
        {!hasStars && hasNebula && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: CARD_NEBULA,
              opacity: config.nebula,
            }}
          />
        )}

        {/* Glow effect for focus role */}
        {config.glow && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              boxShadow: CARD_GLOW,
            }}
          />
        )}

        {/* Inner highlight (top-left sheen) */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: CARD_INNER_HIGHLIGHT,
            opacity: role === 'modal' ? 0.3 : role === 'focus' ? 0.4 : 1.0,
          }}
        />

        {/* Noise / Texture overlay */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            backgroundImage: "url('/noise.png'), " + NOISE_FALLBACK,
            opacity: NOISE_OPACITY,
            mixBlendMode: NOISE_BLEND_MODE,
            backgroundSize: '200px 200px, auto',
          }}
        />

        <div className={cn('relative', padding)}>
          {children}
        </div>
      </div>
    </div>
  );
}
