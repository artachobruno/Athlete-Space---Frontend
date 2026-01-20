/**
 * CoachInsight
 *
 * AI feedback block displayed within WorkoutSessionCard.
 * This is the "premium + intelligent" moment of the platform.
 *
 * Design rules:
 * - Always optional
 * - Darker inset surface than card
 * - Prefixed with small "AI" badge (text only, no icon)
 * - Max 2 lines, clamp overflow
 * - Tone mapping: positive = green glow, warning = amber glow, neutral = no accent
 */

import { cn } from '@/lib/utils';
import type { CoachTone } from './types';

interface CoachInsightProps {
  /** The coach feedback message */
  message: string;
  /** Tone affects the visual accent */
  tone: CoachTone;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Maps tone to subtle glow/accent styling
 */
function getToneClasses(tone: CoachTone): string {
  switch (tone) {
    case 'positive':
      return 'ring-1 ring-[hsl(var(--load-fresh))]/20';
    case 'warning':
      return 'ring-1 ring-[hsl(var(--training-threshold))]/20';
    case 'neutral':
    default:
      return '';
  }
}

export function CoachInsight({ message, tone, className }: CoachInsightProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        'mx-3 mb-3 px-3 py-2 rounded-lg',
        'bg-[hsl(var(--background))]',
        'dark:bg-gradient-to-b dark:from-[#0d141d] dark:to-[#0f161f]',
        getToneClasses(tone),
        className
      )}
      style={{
        boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className="flex items-start gap-2">
        {/* AI Badge - text only, no icon */}
        <div className="text-[7px] uppercase tracking-[0.12em] font-medium mt-0.5 text-muted-foreground/60 shrink-0">
          AI
        </div>

        {/* Message - max 2 lines with clamping */}
        <div className="flex-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
          {message}
        </div>
      </div>
    </div>
  );
}
