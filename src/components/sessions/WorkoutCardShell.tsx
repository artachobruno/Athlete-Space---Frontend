import { cn } from '@/lib/utils';
import {
  CARD_BG,
  CARD_BORDER,
  CARD_INNER_HIGHLIGHT,
  CARD_INNER_SHADOW,
  CARD_LIGHT_FIELD,
  CARD_GLOW,
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
    <div
      className={cn(
        // Base glass card
        'relative rounded-xl border backdrop-blur-[14px]',
        'shadow-sm transition-all motion-safe:duration-200',
        'border-white/5',

        // Hover
        'hover:shadow-lg hover:border-white/20',

        // Glow for key workouts
        highlighted && 'ring-1 ring-cyan-400/40'
      )}
      style={{
        ...scheduleThemeVars,
        background: CARD_BG,
        borderColor: CARD_BORDER,
        boxShadow: highlighted
          ? `${CARD_GLOW}, ${CARD_INNER_SHADOW}`
          : CARD_INNER_SHADOW,
      }}
    >
      {/* Inner highlight (top-left sheen) */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: CARD_INNER_HIGHLIGHT,
        }}
      />

      {/* Card light field (glow star) - localized radial light emitter */}
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
  );
}
