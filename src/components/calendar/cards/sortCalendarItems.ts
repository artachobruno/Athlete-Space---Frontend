import type { CalendarItem } from '@/types/calendar';

/**
 * Sorts calendar items to ensure consistent ordering.
 * The "top card" (first item) is the one that will be clickable in CalendarWorkoutStack.
 * 
 * Sorting policy:
 * 1. Completed items first (so actuals sit on top)
 * 2. Higher load first (if present)
 * 3. Longer duration first
 * 4. Stable tie-breaker by title/id
 */
export function sortCalendarItems(items: CalendarItem[]): CalendarItem[] {
  return [...items].sort((a, b) => {
    // Completed first
    const ak = a.kind === 'completed' ? 0 : 1;
    const bk = b.kind === 'completed' ? 0 : 1;
    if (ak !== bk) return ak - bk;

    // Higher load first
    const aload = a.load ?? 0;
    const bload = b.load ?? 0;
    if (aload !== bload) return bload - aload;

    // Longer duration first
    if (a.durationMin !== b.durationMin) return b.durationMin - a.durationMin;

    // Stable tie-breaker by title
    const at = (a.title || '').toLowerCase();
    const bt = (b.title || '').toLowerCase();
    if (at !== bt) return at.localeCompare(bt);

    // Final tie-breaker by id
    return a.id.localeCompare(b.id);
  });
}
