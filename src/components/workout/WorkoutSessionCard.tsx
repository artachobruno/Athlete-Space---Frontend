/**
 * WorkoutSessionCard
 *
 * Canonical workout session card component used across:
 * - Dashboard (full card)
 * - Calendar (compact mode)
 * - Training Plan (planned phase)
 *
 * Responsibilities:
 * - Layout
 * - Phase styling
 * - Composition only (NO logic)
 *
 * Design rules:
 * - planned → muted metrics
 * - completed → brighter metrics
 * - compliance → strike planned, highlight completed
 * - Green accent border ONLY for compliance
 * - rounded-xl for cards, rounded-lg for inner surfaces
 * - Single soft shadow max
 * - Dark slate blue base only
 * - No glass blur, no gradients on card, no icons, no charts beyond EffortGraph
 */

import { cn } from '@/lib/utils';
import { EffortGraph } from './EffortGraph';
import { WorkoutMetricsRow } from './WorkoutMetricsRow';
import { CoachInsight } from './CoachInsight';
import type { WorkoutSession, WorkoutType } from './types';

interface WorkoutSessionCardProps {
  /** Workout session data */
  session: WorkoutSession;
  /** Compact mode for calendar view - hides CoachInsight, reduces padding */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Maps workout type to display label
 */
function getTypeLabel(type: WorkoutType): string {
  const labels: Record<WorkoutType, string> = {
    threshold: 'Threshold',
    interval: 'Intervals',
    recovery: 'Recovery',
    long: 'Long Run',
    easy: 'Easy',
    tempo: 'Tempo',
  };
  return labels[type] || type;
}

/**
 * Determines border styling based on phase
 */
function getBorderStyle(
  phase: WorkoutSession['phase'],
  isGoodCompliance: boolean
): React.CSSProperties {
  if (phase === 'compliance') {
    // Green accent for good compliance, neutral otherwise
    const accentColor = isGoodCompliance
      ? 'hsl(var(--load-fresh))'
      : 'hsl(var(--muted-foreground))';
    return {
      borderLeft: `2px solid ${accentColor}`,
      borderTop: '1px solid hsl(var(--border))',
      borderRight: '1px solid hsl(var(--border))',
      borderBottom: '1px solid hsl(var(--border))',
    };
  }
  if (phase === 'completed') {
    return { border: '1px solid hsl(var(--border))' };
  }
  // planned - slightly muted border
  return { border: '1px solid hsl(var(--border) / 0.6)' };
}

/**
 * Calculates compliance quality based on distance and duration variance
 */
function calculateCompliance(
  planned?: { distanceKm: number; durationSec: number },
  completed?: { distanceKm: number; durationSec: number }
): boolean {
  if (!planned || !completed) return false;
  if (planned.distanceKm === 0 || planned.durationSec === 0) return true;

  const distanceVariance = Math.abs(
    (completed.distanceKm - planned.distanceKm) / planned.distanceKm
  );
  const durationVariance = Math.abs(
    (completed.durationSec - planned.durationSec) / planned.durationSec
  );

  // Good compliance: within 15% for both metrics
  return distanceVariance < 0.15 && durationVariance < 0.15;
}

export function WorkoutSessionCard({
  session,
  compact = false,
  className,
}: WorkoutSessionCardProps) {
  const { phase, type, title, planned, completed, effortData, plannedEffortData, coachInsight } = session;

  const isCompliance = phase === 'compliance';
  const isCompleted = phase === 'completed';

  const isGoodCompliance = isCompliance
    ? calculateCompliance(planned, completed)
    : false;

  // Determine effort graph display mode
  const showEffortData = isCompleted || isCompliance;
  const graphData = effortData || plannedEffortData || [];

  // Display title: use session title or fall back to type label
  const displayTitle = title || getTypeLabel(type);

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden h-full flex flex-col',
        'bg-[hsl(var(--card))]',
        'dark:bg-gradient-to-b dark:from-[#1a2331] dark:to-[#151d28]',
        className
      )}
      style={{
        ...getBorderStyle(phase, isGoodCompliance),
        boxShadow:
          '0 1px 3px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Session title header */}
      <div className={cn('px-2 pt-2', compact ? 'pb-1' : 'px-4 pt-4 pb-3')}>
        <div className={cn(
          'font-semibold tracking-tight text-foreground truncate',
          compact ? 'text-[10px]' : 'text-sm'
        )}>
          {displayTitle}
        </div>
        {!compact && (
          <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground mt-0.5">
            {getTypeLabel(type)}
          </div>
        )}
      </div>

      {/* Metrics row */}
      <div className="flex-shrink-0">
        <WorkoutMetricsRow 
          planned={planned} 
          completed={completed} 
          phase={phase} 
          compact={compact}
        />
      </div>

      {/* Effort graph - fills remaining space */}
      {graphData.length > 0 && (
        <div className="flex-1 min-h-0">
          <EffortGraph
            data={effortData || plannedEffortData || []}
            showData={showEffortData}
            plannedData={isCompliance ? plannedEffortData : undefined}
            isCompliance={isCompliance}
            compact={compact}
          />
        </div>
      )}

      {/* Coach insight - hidden in compact mode */}
      {!compact && coachInsight && (
        <div className="flex-shrink-0">
          <CoachInsight message={coachInsight.message} tone={coachInsight.tone} />
        </div>
      )}
    </div>
  );
}
