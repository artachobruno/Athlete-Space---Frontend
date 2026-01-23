import { cn } from '@/lib/utils';
import {
  CARD_BG,
  CARD_BORDER,
  CARD_INNER_HIGHLIGHT,
  CARD_INNER_SHADOW,
  CARD_NEBULA,
  STELLAR_DENSITY,
  NOISE_OPACITY,
  NOISE_BLEND_MODE,
  NOISE_FALLBACK,
  scheduleThemeVars,
} from '@/styles/scheduleTheme';

interface WorkoutCardShellProps {
  children: React.ReactNode;
  highlighted?: boolean;
  intent?: 'easy' | 'steady' | 'tempo' | 'intervals' | 'long' | 'rest';
}

export function WorkoutCardShell({
  children,
  highlighted = false,
  intent = 'easy',
}: WorkoutCardShellProps) {
  const stellarSize = STELLAR_DENSITY[intent] || STELLAR_DENSITY.easy;
  return (
    <div className="relative">
      {/* Actual card */}
      <div
        className={cn(
          // Base glass card
          'relative rounded-xl backdrop-blur-[14px]',
          'shadow-sm transition-all motion-safe:duration-200',
          
          // Border only for non-highlighted cards (highlighted = pure light)
          !highlighted && 'border border-white/5',

          // Hover
          'hover:shadow-lg'
        )}
        style={{
          ...scheduleThemeVars,
          background: CARD_BG,
          borderColor: CARD_BORDER,
          boxShadow: CARD_INNER_SHADOW,
        }}
      >
        {/* Stellar field - actual stars (SVG) + nebula mist - behind highlight */}
        {highlighted && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              backgroundImage: `url('/stars.svg'), ${CARD_NEBULA}`,
              backgroundSize: `${stellarSize}, cover`,
              backgroundRepeat: 'repeat, no-repeat',
              backgroundPosition: '0% 0%, 70% 50%',
              opacity: 0.85,
            }}
          />
        )}

        {/* Inner highlight (top-left sheen) - on top of stellar field, subtle */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: CARD_INNER_HIGHLIGHT,
            opacity: highlighted ? 0.5 : 1.0,
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

        <div className="relative p-3">
          {children}
        </div>
      </div>
    </div>
  );
}
