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
    threshold: 'Threshold Run',
    interval: 'Interval',
    recovery: 'Recovery',
    long: 'Long Run',
    easy: 'Easy Run',
    tempo: 'Tempo Run',
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

  const distanceVariance = Math.abs(
    (completed.distanceKm - planned.distanceKm) / planned.distanceKm
  );
  const durationVariance = Math.abs(
    (completed.durationSec - planned.durationSec) / planned.durationSec
  );

  // Good compliance: within 5% for both metrics
  return distanceVariance < 0.05 && durationVariance < 0.05;
}

export function WorkoutSessionCard({
  session,
  compact = false,
  className,
}: WorkoutSessionCardProps) {
  const { phase, type, planned, completed, effortData, plannedEffortData, coachInsight } = session;

  const isCompliance = phase === 'compliance';
  const isCompleted = phase === 'completed';
  const isPlanned = phase === 'planned';

  const isGoodCompliance = isCompliance
    ? calculateCompliance(planned, completed)
    : false;

  // Determine effort graph display mode
  const showEffortData = isCompleted || isCompliance;
  const graphData = effortData || plannedEffortData || [];

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden',
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
      {/* Session type header */}
      <div className={cn('px-4 pt-4', compact ? 'pb-2' : 'pb-3')}>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {getTypeLabel(type)}
        </div>
      </div>

      {/* Metrics row */}
      <WorkoutMetricsRow planned={planned} completed={completed} phase={phase} />

      {/* Effort graph - always shown (important for scannability) */}
      {graphData.length > 0 && (
        <EffortGraph
          data={effortData || plannedEffortData || []}
          showData={showEffortData}
          plannedData={isCompliance ? plannedEffortData : undefined}
          isCompliance={isCompliance}
        />
      )}

      {/* Coach insight - hidden in compact mode */}
      {!compact && coachInsight && (
        <CoachInsight message={coachInsight.message} tone={coachInsight.tone} />
      )}
    </div>
  );
}
