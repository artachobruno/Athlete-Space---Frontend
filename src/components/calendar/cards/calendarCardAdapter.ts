/**
 * Calendar Card Adapter
 * 
 * Converts CalendarItem to card display props.
 * This is the ONLY place where CalendarItem is accessed.
 */

import type { CalendarItem } from '@/types/calendar';
import { normalizeCalendarSport, normalizeCalendarIntent } from '@/types/calendar';

export interface CalendarCardProps {
  variant: string;
  duration: string;
  workoutType: string;
  title: string;
  distance?: string;
  pace?: string;
  sparkline?: number[];
}

/**
 * Derives card variant from CalendarItem
 */
export function deriveCardVariant(item: CalendarItem): string {
  const isCompleted = item.kind === 'completed';
  const sport = item.sport;
  
  if (sport === 'strength') {
    return 'strength';
  }
  
  if (sport === 'run' || sport === 'other') {
    return isCompleted ? 'completed-running' : 'planned-running';
  }
  
  if (sport === 'ride') {
    return isCompleted ? 'completed-cycling' : 'planned-cycling';
  }
  
  if (sport === 'swim') {
    return isCompleted ? 'completed-swimming' : 'planned-swimming';
  }
  
  // Default to running
  return isCompleted ? 'completed-running' : 'planned-running';
}

/**
 * Converts CalendarItem to CalendarCardProps
 */
export function toCalendarCardProps(item: CalendarItem): CalendarCardProps {
  const variant = deriveCardVariant(item);
  
  const intentLabels: Record<string, string> = {
    easy: 'Easy',
    steady: 'Steady',
    tempo: 'Tempo',
    intervals: 'Intervals',
    long: 'Long',
    rest: 'Rest',
  };

  const workoutType = intentLabels[item.intent] || item.intent;
  const duration = `${item.durationMin}m`;
  
  // Extract pace from secondary metric for completed activities
  let pace: string | undefined = undefined;
  if (item.kind === 'completed' && item.secondary) {
    // Try to extract pace from secondary metric (e.g., "5:30 min/km")
    const paceMatch = item.secondary.match(/(\d+:\d+)/);
    if (paceMatch) {
      pace = paceMatch[1];
    }
  }
  
  // Generate mock sparkline for completed activities
  // In production, this should come from actual activity data
  const sparkline = item.kind === 'completed' && item.compliance === 'complete'
    ? generateMockSparkline()
    : undefined;

  return {
    variant,
    duration,
    workoutType,
    title: item.title || workoutType,
    distance: undefined, // TODO: Add distance to CalendarItem if needed
    pace,
    sparkline,
  };
}

/**
 * Generates a mock sparkline for demonstration
 * In production, this should come from actual activity heart rate or power data
 */
function generateMockSparkline(): number[] {
  const points = 20;
  const data: number[] = [];
  
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    let value: number;
    
    if (progress < 0.2) {
      // Warmup: gradual increase
      value = 0.3 + (progress / 0.2) * 0.2;
    } else if (progress < 0.8) {
      // Main effort: variable intensity
      value = 0.5 + Math.sin(progress * Math.PI * 4) * 0.3 + 0.2;
    } else {
      // Cooldown: gradual decrease
      value = 0.5 - ((progress - 0.8) / 0.2) * 0.3;
    }
    
    // Clamp to 0-1
    value = Math.max(0, Math.min(1, value));
    data.push(value);
  }
  
  return data;
}
