import { cn } from '@/lib/utils';
import {
  CARD_BG,
  CARD_BORDER,
  CARD_INNER_HIGHLIGHT,
  CARD_INNER_SHADOW,
  CARD_STELLAR_FIELD,
  NOISE_OPACITY,
  NOISE_BLEND_MODE,
  NOISE_FALLBACK,
  scheduleThemeVars,
} from '@/styles/scheduleTheme';

interface WorkoutCardShellProps {
  children: React.ReactNode;
  highlighted?: boolean;
}

export function WorkoutCardShell({
  children,
  highlighted = false,
}: WorkoutCardShellProps) {
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
        {/* Inner highlight (top-left sheen) */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: CARD_INNER_HIGHLIGHT,
          }}
        />

        {/* Stellar field - milky way style texture (sparse stars, not glow) */}
        {highlighted && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: CARD_STELLAR_FIELD,
              opacity: 0.6,
            }}
          />
        )}

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
