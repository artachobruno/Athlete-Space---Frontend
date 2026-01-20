/**
 * Calendar Types - Authoritative data contract for calendar UI
 * DO NOT invent fields beyond this contract
 */

export type CalendarSport = 'run' | 'ride' | 'swim' | 'strength' | 'race' | 'other';

export type CalendarIntent = 'easy' | 'steady' | 'tempo' | 'intervals' | 'long' | 'rest';

export type CalendarKind = 'planned' | 'completed';

export type CalendarCompliance = 'complete' | 'partial' | 'missed';

/**
 * Normalized calendar item for UI rendering
 */
export interface CalendarItem {
  id: string;
  kind: CalendarKind;
  sport: CalendarSport;
  intent: CalendarIntent;
  title: string;
  startLocal: string; // ISO datetime string
  durationMin: number;
  load?: number;
  distanceKm?: number; // Distance in kilometers
  pace?: string; // Formatted pace string (e.g., "5:30 /km")
  secondary?: string; // e.g., "Z2", "HR 145", "RPE 7"
  isPaired?: boolean;
  compliance?: CalendarCompliance;
  description?: string; // Workout description or coach notes
  coachNote?: {
    text: string;
    tone: 'warning' | 'encouragement' | 'neutral';
  };
}

/**
 * Grouped calendar items for the same day/timeslot
 */
export interface GroupedCalendarItem {
  items: CalendarItem[];
  count: number;
  hasAM: boolean;
  hasPM: boolean;
  totalDuration: number;
  totalLoad: number;
}

/**
 * Day summary for month view footer
 */
export interface DaySummary {
  date: string;
  totalDuration: number;
  totalLoad: number;
  qualitySessions: number; // tempo, intervals, long
  items: CalendarItem[];
}

/**
 * Maps backend sport types to calendar sport types
 */
export function normalizeCalendarSport(
  sport: string | null | undefined,
  title?: string | null | undefined
): CalendarSport {
  if (!sport) return 'other';
  const lower = sport.toLowerCase();
  const titleLower = title?.toLowerCase() || '';

  // Check title first for race/event keywords (since backend may normalize 'Race' to 'run')
  if (titleLower.includes('race') || titleLower.includes('marathon') || titleLower.includes('5k') || 
      titleLower.includes('10k') || titleLower.includes('half marathon') || titleLower.includes('ironman') ||
      titleLower.includes('triathlon') || titleLower.includes('event')) {
    return 'race';
  }

  if (lower.includes('race') || lower.includes('event')) return 'race';
  if (lower.includes('run') || lower === 'running') return 'run';
  if (lower.includes('ride') || lower.includes('cycling') || lower.includes('bike')) return 'ride';
  if (lower.includes('swim')) return 'swim';
  if (lower.includes('strength') || lower.includes('weight') || lower.includes('gym')) return 'strength';

  return 'other';
}

/**
 * Maps backend intent types to calendar intent types
 */
export function normalizeCalendarIntent(intent: string | null | undefined): CalendarIntent {
  if (!intent) return 'easy';
  const lower = intent.toLowerCase();
  
  if (lower.includes('easy') || lower.includes('recovery') || lower.includes('aerobic')) return 'easy';
  if (lower.includes('steady') || lower.includes('endurance')) return 'steady';
  if (lower.includes('tempo') || lower.includes('threshold')) return 'tempo';
  if (lower.includes('interval') || lower.includes('vo2') || lower.includes('speed')) return 'intervals';
  if (lower.includes('long')) return 'long';
  if (lower.includes('rest') || lower.includes('off')) return 'rest';
  
  return 'easy';
}

/**
 * Checks if intent is a "quality" session
 */
export function isQualitySession(intent: CalendarIntent): boolean {
  return intent === 'tempo' || intent === 'intervals' || intent === 'long';
}

/**
 * Groups calendar items by date
 */
export function groupItemsByDate(items: CalendarItem[]): Map<string, DaySummary> {
  const map = new Map<string, DaySummary>();
  
  for (const item of items) {
    const date = item.startLocal.split('T')[0];
    
    if (!map.has(date)) {
      map.set(date, {
        date,
        totalDuration: 0,
        totalLoad: 0,
        qualitySessions: 0,
        items: [],
      });
    }
    
    const summary = map.get(date)!;
    summary.items.push(item);
    summary.totalDuration += item.durationMin;
    summary.totalLoad += item.load || 0;
    
    if (isQualitySession(item.intent)) {
      summary.qualitySessions++;
    }
  }
  
  return map;
}

/**
 * Groups duplicate sessions on the same day
 */
export function groupDuplicateSessions(items: CalendarItem[]): GroupedCalendarItem[] {
  if (items.length <= 1) {
    return items.map(item => ({
      items: [item],
      count: 1,
      hasAM: isAM(item.startLocal),
      hasPM: !isAM(item.startLocal),
      totalDuration: item.durationMin,
      totalLoad: item.load || 0,
    }));
  }
  
  // Group by sport + intent for collapsing
  const groups = new Map<string, CalendarItem[]>();
  
  for (const item of items) {
    const key = `${item.sport}-${item.intent}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  
  return Array.from(groups.values()).map(groupItems => ({
    items: groupItems,
    count: groupItems.length,
    hasAM: groupItems.some(i => isAM(i.startLocal)),
    hasPM: groupItems.some(i => !isAM(i.startLocal)),
    totalDuration: groupItems.reduce((sum, i) => sum + i.durationMin, 0),
    totalLoad: groupItems.reduce((sum, i) => sum + (i.load || 0), 0),
  }));
}

function isAM(dateString: string): boolean {
  const date = new Date(dateString);
  return date.getHours() < 12;
}
