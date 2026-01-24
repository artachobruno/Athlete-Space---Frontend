import { CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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

/**
 * Get intensity badge label from intensity or type
 */
function getIntensityLabel(intensity: string | null | undefined, type: string | null | undefined): string {
  const value = intensity || type || '';
  const lower = value.toLowerCase();
  
  if (lower.includes('easy') || lower.includes('recovery')) return 'EASY';
  if (lower.includes('threshold') || lower.includes('tempo')) return 'TEMPO';
  if (lower.includes('vo2') || lower.includes('interval')) return 'INTERVALS';
  if (lower.includes('long') || lower.includes('endurance')) return 'LONG';
  if (lower.includes('steady')) return 'STEADY';
  if (lower.includes('rest')) return 'REST';
  
  // Default to uppercase of the value or 'EASY'
  return value ? value.toUpperCase() : 'EASY';
}

export function CombinedSessionCard({
  executionSummary,
  onClick,
  variant = 'week',
}: CombinedSessionCardProps) {
  const { planned, activity, executionState } = executionSummary;

  // Get title (prefer planned, fallback to activity)
  const title = planned?.title || activity?.title || 'Activity';
  
  // Get intensity for badge (from planned intensity or type)
  const intensityLabel = getIntensityLabel(planned?.intensity, planned?.type);
  
  // Show "Done" badge only when completed
  const showDoneBadge = executionState === 'COMPLETED_AS_PLANNED';
  
  // Get time and distance (prefer activity if completed, otherwise planned)
  const displayDuration = activity?.duration 
    ? formatDuration(activity.duration * 60)
    : planned?.duration_minutes 
      ? formatDuration(planned.duration_minutes * 60)
      : null;
  
  const displayDistance = activity?.distance
    ? formatDistance(activity.distance * 1000)
    : planned?.distance_km
      ? formatDistance(planned.distance_km * 1000)
      : null;

  // Get coach feedback
  const coachFeedback = planned?.coach_insight;

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-card overflow-hidden',
        'transition-all hover:border-border/80',
        onClick && 'cursor-pointer',
        variant === 'week' && 'text-xs'
      )}
      onClick={onClick}
    >
      {/* Row 1: Status Badges (Easy Done) */}
      <div className="px-2 pt-2 pb-1 flex items-center gap-1.5">
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium whitespace-nowrap shrink-0">
          {intensityLabel}
        </Badge>
        {showDoneBadge && (
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-medium whitespace-nowrap shrink-0 text-load-fresh border-load-fresh/30">
            Done
          </Badge>
        )}
      </div>

      {/* Row 2: Title */}
      <div className="px-2 pb-1">
        <p className="font-medium text-foreground text-sm truncate">{title}</p>
      </div>

      {/* Row 3: Time · Distance */}
      {(displayDuration || displayDistance) && (
        <div className="px-2 pb-1 text-muted-foreground text-[10px] truncate">
          {displayDuration}
          {displayDuration && displayDistance && ' · '}
          {displayDistance}
        </div>
      )}

      {/* Row 4: Coach Feedback */}
      {coachFeedback && (
        <div className="px-2 pb-2">
          <p className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
            {coachFeedback}
          </p>
        </div>
      )}
    </div>
  );
}
