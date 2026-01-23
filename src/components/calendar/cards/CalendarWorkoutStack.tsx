import { CalendarWorkoutCardSvg } from './CalendarWorkoutCardSvg';
import { WorkoutSessionCard } from '@/components/workout/WorkoutSessionCard';
import { calendarItemToWorkoutSession } from '@/components/workout/workoutSessionAdapter';
import { SessionCard } from '@/components/sessions/SessionCard';
import type { CalendarItem } from '@/types/calendar';
import { isHighlightedIntent } from '@/types/calendar';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { fetchActivityStreams } from '@/lib/api';

interface Props {
  items: CalendarItem[];
  variant: 'month' | 'week' | 'plan';
  maxVisible?: number;
  onClick?: (item: CalendarItem) => void;
  className?: string;
  activityIdBySessionId?: Record<string, string | null | undefined>;
  /** Use new React-based SessionCard instead of SVG card (Phase 4: default true) */
  useNewCard?: boolean;
}

export function CalendarWorkoutStack({
  items,
  variant,
  maxVisible = 3,
  onClick,
  className,
  activityIdBySessionId,
  useNewCard = true, // Phase 4: Default to React-based SessionCard
}: Props) {
  const visible = items.slice(0, maxVisible);
  const topItem = visible[0];
  const activityId = topItem ? activityIdBySessionId?.[topItem.id] : null;

  const { data: activityStreams } = useAuthenticatedQuery({
    queryKey: ['activityStreams', 'calendar', activityId],
    queryFn: () => fetchActivityStreams(activityId as string),
    retry: 1,
    enabled: Boolean(activityId),
    staleTime: 15 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  if (visible.length === 0) {
    return null;
  }

  // Phase 4.5: Determine density based on variant
  // Month view uses compact, Week view uses standard
  const density = variant === 'month' ? 'compact' : 'standard';

  // Phase 4: New React-based SessionCard (replaces SVG)
  if (useNewCard && visible.length === 1) {
    const item = visible[0];

    return (
      <div
        className={`w-full h-full p-1 ${className ?? ''}`}
        onClick={() => onClick?.(item)}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <SessionCard 
          session={item} 
          density={density} 
          className="h-full"
          highlighted={isHighlightedIntent(item.intent)}
        />
      </div>
    );
  }

  // Phase 4: Stack layout with React-based SessionCard
  if (useNewCard && visible.length > 1) {
    const getScale = (index: number): number => {
      if (index === 0) return 1.0;
      if (index === 1) return 0.97;
      return 0.94;
    };

    const getOffset = (index: number): { x: number; y: number } => ({
      x: index * 4,
      y: index * 4,
    });

    return (
      <div className={`relative w-full h-full p-1 ${className ?? ''}`}>
        {visible.map((item, i) => {
          const offset = getOffset(i);
          const scale = getScale(i);
          const isTopCard = i === 0;

          return (
            <div
              key={item.id}
              className="absolute inset-1 transition-all duration-[140ms] ease-out"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                zIndex: visible.length - i,
                pointerEvents: isTopCard ? 'auto' : 'none',
              }}
              onClick={() => isTopCard && onClick?.(item)}
            >
              <SessionCard 
          session={item} 
          density={density} 
          className="h-full"
          highlighted={isHighlightedIntent(item.intent)}
        />
            </div>
          );
        })}
      </div>
    );
  }

  // Legacy SVG mode (deprecated - Phase 4: Use SessionCard instead)
  // This fallback is kept for backward compatibility but should not be used
  const getScale = (index: number): number => {
    if (index === 0) return 1.0;
    if (index === 1) return 0.97;
    if (index === 2) return 0.94;
    return 0.91 - (index - 3) * 0.03;
  };

  const getOffset = (index: number): { x: number; y: number } => ({
    x: index * 6,
    y: index * 6,
  });

  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      {visible.map((item, i) => {
        const offset = getOffset(i);
        const scale = getScale(i);
        const isTopCard = i === 0;

        return (
          <div
            key={item.id}
            className="absolute inset-0 transition-all duration-[140ms] ease-out"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'top left',
              zIndex: visible.length - i,
              pointerEvents: isTopCard ? 'auto' : 'none',
            }}
            onMouseEnter={(e) => {
              if (isTopCard) {
                e.currentTarget.style.transform = `translate(${offset.x}px, ${
                  offset.y - 2
                }px) scale(${scale * 1.01})`;
              }
            }}
            onMouseLeave={(e) => {
              if (isTopCard) {
                e.currentTarget.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
              }
            }}
            onClick={() => {
              if (isTopCard && onClick) {
                onClick(item);
              }
            }}
          >
            <div
              className="flex items-center justify-center w-full h-full"
              style={{
                aspectRatio: variant === 'month' ? '320 / 220' : '600 / 360',
                maxWidth: '100%',
                maxHeight: '100%',
              }}
            >
              <CalendarWorkoutCardSvg
                item={item}
                viewVariant={variant}
                streams={isTopCard ? activityStreams ?? null : null}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
