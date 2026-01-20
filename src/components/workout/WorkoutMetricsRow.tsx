/**
 * WorkoutMetricsRow
 *
 * Displays workout metrics (distance, duration, pace) in a horizontal row.
 * Supports planned, completed, and compliance (strike-through) modes.
 * Respects user's unit system preference (imperial/metric).
 *
 * Design rules:
 * - Numbers > labels (visual hierarchy)
 * - Uses CSS vars from theme
 * - No icons, no gradients
 */

import { cn } from '@/lib/utils';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import type { WorkoutMetrics, WorkoutPhase } from './types';

interface WorkoutMetricsRowProps {
  /** Planned metrics (shown for planned phase, strike-through for compliance) */
  planned?: WorkoutMetrics;
  /** Completed metrics (shown for completed and compliance phases) */
  completed?: WorkoutMetrics;
  /** Current phase determines display mode */
  phase: WorkoutPhase;
  /** Compact mode for calendar views */
  compact?: boolean;
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
 * Formats pace from seconds per unit to m:ss format
 */
function formatPaceValue(secondsPerUnit: number): string {
  if (!secondsPerUnit || !Number.isFinite(secondsPerUnit)) return '--:--';
  const minutes = Math.floor(secondsPerUnit / 60);
  const secs = Math.floor(secondsPerUnit % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const KM_TO_MILES = 0.621371;
const SEC_PER_KM_TO_SEC_PER_MI = 1.60934;

export function WorkoutMetricsRow({
  planned,
  completed,
  phase,
  compact = false,
  className,
}: WorkoutMetricsRowProps) {
  const { unitSystem } = useUnitSystem();
  const isImperial = unitSystem === 'imperial';

  const showCompliance = phase === 'compliance' && planned && completed;
  const displayData = phase === 'completed' ? completed : planned;
  const isCompleted = phase === 'completed';

  if (!displayData && !showCompliance) {
    return null;
  }

  // Convert distance based on unit system
  const convertDistance = (km: number): number => {
    return isImperial ? km * KM_TO_MILES : km;
  };

  // Convert pace based on unit system (seconds per km to seconds per mile)
  const convertPace = (secPerKm: number): number => {
    return isImperial ? secPerKm * SEC_PER_KM_TO_SEC_PER_MI : secPerKm;
  };

  const distanceUnit = isImperial ? 'mi' : 'km';
  const paceUnit = isImperial ? '/mi' : '/km';

  return (
    <div
      className={cn(
        'rounded-lg',
        'bg-[hsl(var(--muted))]',
        'dark:bg-gradient-to-b dark:from-[hsl(var(--card))] dark:to-[hsl(var(--background))]',
        compact ? 'mx-1.5 mb-1.5 px-1.5 py-1.5' : 'mx-3 mb-3 px-3.5 py-3',
        className
      )}
      style={{
        boxShadow:
          'inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.02)',
      }}
    >
      <div className="grid grid-cols-3 gap-0">
        {/* Distance */}
        <div className={cn(
          'border-r border-[hsl(var(--border))] border-opacity-40 min-w-0',
          compact ? 'pr-1' : 'pr-3.5'
        )}>
          <div className={cn(
            'font-medium uppercase tracking-[0.1em] mb-1 text-muted-foreground',
            compact ? 'text-[6px]' : 'text-[8px]'
          )}>
            Dist
          </div>
          {showCompliance && planned && completed ? (
            <div className="space-y-0.5">
              <div className={cn(
                'font-medium line-through leading-none opacity-50 text-muted-foreground font-mono',
                compact ? 'text-[8px]' : 'text-[10px]'
              )}>
                {convertDistance(planned.distanceKm).toFixed(1)}
              </div>
              <div className={cn(
                'font-semibold leading-none tracking-tight text-foreground font-mono',
                compact ? 'text-[11px]' : 'text-[18px]'
              )}>
                {convertDistance(completed.distanceKm).toFixed(1)}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'font-semibold leading-none tracking-tight font-mono',
                isCompleted
                  ? compact ? 'text-[11px] text-foreground' : 'text-[18px] text-foreground'
                  : compact ? 'text-[10px] text-muted-foreground' : 'text-[16px] text-muted-foreground'
              )}
            >
              {displayData?.distanceKm ? convertDistance(displayData.distanceKm).toFixed(1) : '--'}
            </div>
          )}
          <div className={cn(
            'font-medium mt-0.5 text-muted-foreground/60',
            compact ? 'text-[5px]' : 'text-[8px]'
          )}>
            {distanceUnit}
          </div>
        </div>

        {/* Duration */}
        <div className={cn(
          'border-r border-[hsl(var(--border))] border-opacity-40 min-w-0',
          compact ? 'px-1' : 'px-3.5'
        )}>
          <div className={cn(
            'font-medium uppercase tracking-[0.1em] mb-1 text-muted-foreground',
            compact ? 'text-[6px]' : 'text-[8px]'
          )}>
            Time
          </div>
          {showCompliance && planned && completed ? (
            <div className="space-y-0.5">
              <div className={cn(
                'font-medium line-through leading-none opacity-50 text-muted-foreground font-mono',
                compact ? 'text-[8px]' : 'text-[10px]'
              )}>
                {formatDuration(planned.durationSec)}
              </div>
              <div className={cn(
                'font-semibold leading-none tracking-tight text-foreground font-mono',
                compact ? 'text-[11px]' : 'text-[18px]'
              )}>
                {formatDuration(completed.durationSec)}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'font-semibold leading-none tracking-tight font-mono',
                isCompleted
                  ? compact ? 'text-[11px] text-foreground' : 'text-[18px] text-foreground'
                  : compact ? 'text-[10px] text-muted-foreground' : 'text-[16px] text-muted-foreground'
              )}
            >
              {displayData ? formatDuration(displayData.durationSec) : '--:--'}
            </div>
          )}
          <div className={cn(
            'font-medium mt-0.5 text-muted-foreground/60',
            compact ? 'text-[5px]' : 'text-[8px]'
          )}>
            h:mm
          </div>
        </div>

        {/* Pace */}
        <div className={cn('min-w-0', compact ? 'pl-1' : 'pl-3.5')}>
          <div className={cn(
            'font-medium uppercase tracking-[0.1em] mb-1 text-muted-foreground',
            compact ? 'text-[6px]' : 'text-[8px]'
          )}>
            Pace
          </div>
          {showCompliance && planned && completed ? (
            <div className="space-y-0.5">
              <div className={cn(
                'font-medium line-through leading-none opacity-50 text-muted-foreground font-mono',
                compact ? 'text-[8px]' : 'text-[10px]'
              )}>
                {formatPaceValue(convertPace(planned.paceSecPerKm))}
              </div>
              <div className={cn(
                'font-semibold leading-none tracking-tight text-foreground font-mono',
                compact ? 'text-[11px]' : 'text-[18px]'
              )}>
                {formatPaceValue(convertPace(completed.paceSecPerKm))}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'font-semibold leading-none tracking-tight font-mono',
                isCompleted
                  ? compact ? 'text-[11px] text-foreground' : 'text-[18px] text-foreground'
                  : compact ? 'text-[10px] text-muted-foreground' : 'text-[16px] text-muted-foreground'
              )}
            >
              {displayData ? formatPaceValue(convertPace(displayData.paceSecPerKm)) : '--:--'}
            </div>
          )}
          <div className={cn(
            'font-medium mt-0.5 text-muted-foreground/60',
            compact ? 'text-[5px]' : 'text-[8px]'
          )}>
            {paceUnit}
          </div>
        </div>
      </div>
    </div>
  );
}
