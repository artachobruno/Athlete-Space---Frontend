import { cn } from '@/lib/utils';
import {
  CARD_BG,
  CARD_BORDER,
  CARD_INNER_HIGHLIGHT,
  CARD_INNER_SHADOW,
  CARD_LIGHT_FIELD,
  CARD_HALO,
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
    <div className="relative z-0">
      {/* Outer halo (NOT clipped by card, sits behind card) */}
      {highlighted && (
        <div
          className="absolute -inset-10 z-0 pointer-events-none"
          style={{
            background: CARD_HALO,
            filter: 'blur(6px)',
            mixBlendMode: 'screen',
            opacity: 0.85,
          }}
        />
      )}

      {/* Actual card */}
      <div
        className={cn(
          // Base glass card
          'relative z-10 rounded-xl backdrop-blur-[14px]',
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

        {/* Internal glow star - localized radial light emitter */}
        {highlighted && (
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: CARD_LIGHT_FIELD,
              opacity: 0.9,
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
