import { CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ExecutionSummary } from '@/types/execution';
import {
  EXECUTION_STATE_COLORS,
  EXECUTION_STATE_BG_COLORS,
} from '@/types/execution';

interface CombinedSessionCardProps {
  executionSummary: ExecutionSummary;
  onClick?: () => void;
  variant?: 'week' | 'day';
}

/**
 * Format duration in seconds to human-readable string (e.g., "1h 15m")
 */
function formatDuration(seconds: number | undefined | null): string {
  if (!seconds) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format distance in meters to human-readable string (e.g., "11 mi")
 */
function formatDistance(meters: number | undefined | null): string {
  if (!meters) return 'N/A';
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

/**
 * Format delta with sign (e.g., "+2m", "-0.2 mi")
 */
function formatDelta(value: number | undefined, unit: 'm' | 'mi'): string {
  if (value === undefined) return '';
  const sign = value >= 0 ? '+' : '';
  if (unit === 'm') {
    const minutes = Math.abs(value) / 60;
    return `${sign}${minutes.toFixed(0)}m`;
  } else {
    const miles = Math.abs(value) / 1609.34;
    return `${sign}${miles.toFixed(1)} mi`;
  }
}

export function CombinedSessionCard({
  executionSummary,
  onClick,
  variant = 'week',
}: CombinedSessionCardProps) {
  const { planned, activity, executionState, deltas } = executionSummary;

  // Get title (prefer planned, fallback to activity)
  const title = planned?.title || activity?.title || 'Activity';
  const sport = planned?.type || activity?.sport || 'run';

  // State badge configuration
  const stateConfig = {
    PLANNED_ONLY: {
      icon: null,
      label: 'Planned',
      color: EXECUTION_STATE_COLORS.PLANNED_ONLY,
      bgColor: EXECUTION_STATE_BG_COLORS.PLANNED_ONLY,
    },
    COMPLETED_AS_PLANNED: {
      icon: CheckCircle2,
      label: 'Done',
      color: EXECUTION_STATE_COLORS.COMPLETED_AS_PLANNED,
      bgColor: EXECUTION_STATE_BG_COLORS.COMPLETED_AS_PLANNED,
    },
    COMPLETED_UNPLANNED: {
      icon: AlertCircle,
      label: 'Unplanned activity',
      color: EXECUTION_STATE_COLORS.COMPLETED_UNPLANNED,
      bgColor: EXECUTION_STATE_BG_COLORS.COMPLETED_UNPLANNED,
    },
    MISSED: {
      icon: XCircle,
      label: 'Missed',
      color: EXECUTION_STATE_COLORS.MISSED,
      bgColor: EXECUTION_STATE_BG_COLORS.MISSED,
    },
  };

  const config = stateConfig[executionState];
  const StateIcon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-card',
        'transition-all hover:border-border/80',
        onClick && 'cursor-pointer',
        variant === 'week' && 'text-xs'
      )}
      onClick={onClick}
    >
      {/* Title - moved down with more top padding */}
      <div className="px-2 pt-2.5 pb-1.5 border-b border-border/40">
        <p className="font-medium text-foreground truncate">{title}</p>
        {executionState === 'COMPLETED_UNPLANNED' && (
          <p className="text-[10px] text-muted-foreground mt-0.5">(Unplanned)</p>
        )}
      </div>

      {/* Planned Block - moved down */}
      {planned && (
        <div className="px-2 pt-2 pb-1.5 border-b border-border/40 bg-muted/10">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
              Planned
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-[10px]">
              {formatDuration(planned.duration_minutes ? planned.duration_minutes * 60 : null)}
            </span>
            {planned.distance_km && (
              <>
                <span className="text-[9px]">·</span>
                <span className="text-[10px]">
                  {formatDistance(planned.distance_km * 1000)}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Completed Block - moved down */}
      {activity && (
        <div className="px-2 pt-2 pb-1.5 border-b border-border/40">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
              Completed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-foreground">
              {formatDuration(activity.duration ? activity.duration * 60 : null)}
            </span>
            {activity.distance && (
              <>
                <span className="text-[9px] text-muted-foreground">·</span>
                <span className="text-[10px] text-foreground">
                  {formatDistance(activity.distance * 1000)}
                </span>
              </>
            )}
          </div>
          {/* Deltas (only for COMPLETED_AS_PLANNED) */}
          {executionState === 'COMPLETED_AS_PLANNED' && deltas && (
            <div className="mt-1 flex items-center gap-2 text-[9px] text-muted-foreground">
              {deltas.durationSeconds !== undefined && (
                <span>Δ {formatDelta(deltas.durationSeconds, 'm')}</span>
              )}
              {deltas.distanceMeters !== undefined && (
                <>
                  {deltas.durationSeconds !== undefined && (
                    <span>·</span>
                  )}
                  <span>Δ {formatDelta(deltas.distanceMeters, 'mi')}</span>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Coach Insight - moved down, no truncation, full display */}
      {planned?.coach_insight && (
        <div className="px-2 pt-2 pb-2 border-t border-border/40 bg-primary/5">
          <div className="flex items-start gap-1.5">
            <Sparkles className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-[10px] leading-relaxed text-foreground flex-1 break-words">
              {planned.coach_insight}
            </p>
          </div>
        </div>
      )}

      {/* State Badge - moved down */}
      <div
        className={cn(
          'px-2 pt-2 pb-2 flex items-center gap-1.5',
          config.bgColor
        )}
      >
        {StateIcon && (
          <StateIcon className={cn('h-3 w-3', config.color)} />
        )}
        <span className={cn('text-[9px] font-medium truncate max-w-[100px]', config.color)} title={config.label}>
          {config.label}
        </span>
      </div>
    </div>
  );
}
