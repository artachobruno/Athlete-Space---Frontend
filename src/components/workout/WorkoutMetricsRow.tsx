/**
 * WorkoutMetricsRow
 *
 * Displays workout metrics (distance, duration, pace) in a horizontal row.
 * Supports planned, completed, and compliance (strike-through) modes.
 *
 * Design rules:
 * - Numbers > labels (visual hierarchy)
 * - Uses CSS vars from theme
 * - No icons, no gradients
 */

import { cn } from '@/lib/utils';
import type { WorkoutMetrics, WorkoutPhase } from './types';

interface WorkoutMetricsRowProps {
  /** Planned metrics (shown for planned phase, strike-through for compliance) */
  planned?: WorkoutMetrics;
  /** Completed metrics (shown for completed and compliance phases) */
  completed?: WorkoutMetrics;
  /** Current phase determines display mode */
  phase: WorkoutPhase;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats duration from seconds to h:mm or m:ss
 */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats pace from seconds per km to m:ss
 */
function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const secs = Math.floor(secondsPerKm % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function WorkoutMetricsRow({
  planned,
  completed,
  phase,
  className,
}: WorkoutMetricsRowProps) {
  const showCompliance = phase === 'compliance' && planned && completed;
  const displayData = phase === 'completed' ? completed : planned;
  const isCompleted = phase === 'completed';

  if (!displayData && !showCompliance) {
    return null;
  }

  return (
    <div
      className={cn(
        'mx-3 mb-3 px-3.5 py-3 rounded-lg',
        'bg-[hsl(var(--muted))]',
        'dark:bg-gradient-to-b dark:from-[hsl(var(--card))] dark:to-[hsl(var(--background))]',
        className
      )}
      style={{
        boxShadow:
          'inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.02)',
      }}
    >
      <div className="grid grid-cols-3 gap-0">
        {/* Distance */}
        <div className="pr-3.5 border-r border-[hsl(var(--border))] border-opacity-40">
          <div className="text-[8px] font-medium uppercase tracking-[0.1em] mb-1.5 text-muted-foreground">
            Distance
          </div>
          {showCompliance && planned && completed ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium line-through leading-none opacity-50 text-muted-foreground font-mono">
                {planned.distanceKm.toFixed(1)}
              </div>
              <div className="text-[18px] font-semibold leading-none tracking-tight text-foreground font-mono">
                {completed.distanceKm.toFixed(1)}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'font-semibold leading-none tracking-tight font-mono',
                isCompleted
                  ? 'text-[18px] text-foreground'
                  : 'text-[16px] text-muted-foreground'
              )}
            >
              {displayData?.distanceKm.toFixed(1)}
            </div>
          )}
          <div className="text-[8px] font-medium mt-1.5 text-muted-foreground/60">
            km
          </div>
        </div>

        {/* Duration */}
        <div className="px-3.5 border-r border-[hsl(var(--border))] border-opacity-40">
          <div className="text-[8px] font-medium uppercase tracking-[0.1em] mb-1.5 text-muted-foreground">
            Duration
          </div>
          {showCompliance && planned && completed ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium line-through leading-none opacity-50 text-muted-foreground font-mono">
                {formatDuration(planned.durationSec)}
              </div>
              <div className="text-[18px] font-semibold leading-none tracking-tight text-foreground font-mono">
                {formatDuration(completed.durationSec)}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'font-semibold leading-none tracking-tight font-mono',
                isCompleted
                  ? 'text-[18px] text-foreground'
                  : 'text-[16px] text-muted-foreground'
              )}
            >
              {displayData && formatDuration(displayData.durationSec)}
            </div>
          )}
          <div className="text-[8px] font-medium mt-1.5 text-muted-foreground/60">
            h:mm
          </div>
        </div>

        {/* Pace */}
        <div className="pl-3.5">
          <div className="text-[8px] font-medium uppercase tracking-[0.1em] mb-1.5 text-muted-foreground">
            Pace
          </div>
          {showCompliance && planned && completed ? (
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium line-through leading-none opacity-50 text-muted-foreground font-mono">
                {formatPace(planned.paceSecPerKm)}
              </div>
              <div className="text-[18px] font-semibold leading-none tracking-tight text-foreground font-mono">
                {formatPace(completed.paceSecPerKm)}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'font-semibold leading-none tracking-tight font-mono',
                isCompleted
                  ? 'text-[18px] text-foreground'
                  : 'text-[16px] text-muted-foreground'
              )}
            >
              {displayData && formatPace(displayData.paceSecPerKm)}
            </div>
          )}
          <div className="text-[8px] font-medium mt-1.5 text-muted-foreground/60">
            / km
          </div>
        </div>
      </div>
    </div>
  );
}
