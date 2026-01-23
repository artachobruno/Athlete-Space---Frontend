/**
 * MobileDayList - Stacked vertical layout for calendar on mobile devices
 * 
 * Displays days as horizontal rows with sessions stacked vertically.
 * Optimized for touch interaction and smaller screens.
 */

import { format, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { SessionCard } from '@/components/sessions/SessionCard';
import { ChevronRight } from 'lucide-react';
import type { CalendarItem } from '@/types/calendar';

interface MobileDayListProps {
  days: Date[];
  getItemsForDay: (date: Date) => CalendarItem[];
  onDayClick?: (date: Date) => void;
  onItemClick?: (item: CalendarItem) => void;
  showEmptyDays?: boolean;
  className?: string;
}

export function MobileDayList({
  days,
  getItemsForDay,
  onDayClick,
  onItemClick,
  showEmptyDays = true,
  className,
}: MobileDayListProps) {
  return (
    <div className={cn('flex flex-col gap-2 overflow-y-auto', className)}>
      {days.map((day) => {
        const items = getItemsForDay(day);
        const isCurrentDay = isToday(day);
        const hasItems = items.length > 0;
        
        // Skip empty days if not showing them
        if (!showEmptyDays && !hasItems) return null;

        return (
          <div
            key={format(day, 'yyyy-MM-dd')}
            className={cn(
              'rounded-lg border bg-transparent transition-colors',
              isCurrentDay && 'ring-2 ring-primary/50 bg-primary/[0.02]'
            )}
          >
            {/* Day Header - always visible, tappable */}
            <div
              className={cn(
                'flex items-center justify-between px-3 py-2 cursor-pointer',
                'border-b border-border/50 hover:bg-muted/30 transition-colors',
                isCurrentDay && 'bg-primary/5'
              )}
              onClick={() => onDayClick?.(day)}
            >
              <div className="flex items-center gap-3">
                {/* Day circle */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex flex-col items-center justify-center',
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50'
                  )}
                >
                  <span className="text-[9px] font-medium uppercase leading-none">
                    {format(day, 'EEE')}
                  </span>
                  <span className="text-sm font-bold leading-none tabular-nums">
                    {format(day, 'd')}
                  </span>
                </div>
                
                {/* Summary */}
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    isCurrentDay ? 'text-primary' : 'text-foreground'
                  )}>
                    {format(day, 'EEEE')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hasItems
                      ? `${items.length} session${items.length > 1 ? 's' : ''} · ${items.reduce((s, i) => s + i.durationMin, 0)}m`
                      : 'Rest day'}
                  </p>
                </div>
              </div>
              
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Sessions - compact list */}
            {hasItems && (
              <div className="p-2 space-y-1.5">
                {items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick?.(item);
                    }}
                    className="cursor-pointer"
                  >
                    <SessionCard
                      session={item}
                      density="compact"
                      className="h-auto"
                    />
                  </div>
                ))}
                {items.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-1">
                    +{items.length - 3} more
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
