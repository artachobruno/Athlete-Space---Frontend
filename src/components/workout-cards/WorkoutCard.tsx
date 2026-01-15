/**
 * WorkoutCard
 * 
 * Wrapper component that maps CalendarItem to WorkoutCardData
 * and renders the SVG card.
 */

import { WorkoutCardSVG } from './WorkoutCardSVG';
import type { WorkoutCardVariant, WorkoutCardData } from './types';
import type { CalendarItem } from '@/types/calendar';

interface WorkoutCardProps {
  item: CalendarItem;
  onClick?: () => void;
  width?: number;
  height?: number;
}

export function WorkoutCard({ item, onClick, width, height }: WorkoutCardProps) {
  const variant = deriveVariant(item);
  const data = deriveCardData(item);

  const cardContent = (
    <div className="w-full h-full rounded-xl overflow-hidden">
      <WorkoutCardSVG variant={variant} data={data} width={width} height={height} />
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full h-full rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/20 transition-transform hover:scale-[1.02]"
        type="button"
      >
        {cardContent}
      </button>
    );
  }

  return cardContent;
}

/**
 * Derives the card variant from a CalendarItem
 */
function deriveVariant(item: CalendarItem): WorkoutCardVariant {
  const isCompleted = item.kind === 'completed';
  
  if (item.sport === 'strength') {
    return 'strength';
  }
  
  if (item.sport === 'run' || item.sport === 'other') {
    return isCompleted ? 'completed-running' : 'planned-running';
  }
  
  if (item.sport === 'ride') {
    return isCompleted ? 'completed-cycling' : 'planned-cycling';
  }
  
  if (item.sport === 'swim') {
    return isCompleted ? 'completed-swimming' : 'planned-swimming';
  }
  
  // Default to running
  return isCompleted ? 'completed-running' : 'planned-running';
}

/**
 * Derives card data from a CalendarItem
 */
function deriveCardData(item: CalendarItem): WorkoutCardData {
  const intentLabels: Record<string, string> = {
    easy: 'Easy',
    steady: 'Steady',
    tempo: 'Tempo',
    intervals: 'Intervals',
    long: 'Long',
    rest: 'Rest',
  };

  const workoutType = intentLabels[item.intent] || item.intent;
  
  // Format duration
  const duration = `${item.durationMin}m`;
  
  // Format distance if available (would need to be added to CalendarItem)
  const distance = undefined; // TODO: Add distance to CalendarItem if needed
  
  // Format pace from secondary metric if available
  let pace: string | undefined = undefined;
  if (item.secondary && item.kind === 'completed') {
    // Try to extract pace from secondary metric
    const paceMatch = item.secondary.match(/(\d+:\d+)/);
    if (paceMatch) {
      pace = paceMatch[1];
    }
  }
  
  // Generate mock sparkline for completed activities
  // In production, this would come from actual activity data
  const sparkline = item.kind === 'completed' && item.compliance === 'complete'
    ? generateMockSparkline()
    : undefined;

  return {
    duration,
    workoutType,
    distance,
    pace,
    title: item.title || workoutType,
    description: undefined,
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
    // Simulate a workout with warmup, main effort, cooldown
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
