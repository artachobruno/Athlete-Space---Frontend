/**
 * Phase 4: Canonical Session Card Component
 * 
 * Single React-based component for session visual representation.
 * Replaces all SVG-based session cards.
 * Based on Training Plan style as visual baseline.
 * 
 * Responsibilities:
 * - Visual representation only (no data fetching)
 * - No navigation (handled by parent)
 * - No expand/collapse (handled by WorkoutDetailCard)
 * - Density variants for different contexts
 */

import { Badge } from '@/components/ui/badge';
import { Clock, Route, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { cn } from '@/lib/utils';
import { WorkoutCardShell } from './WorkoutCardShell';
import { normalizeCalendarIntent, type CalendarIntent } from '@/types/calendar';
import {
  sessionSpacing,
  sessionRadius,
  sessionStatusColors,
  sessionIntentColors,
  sessionFontSizes,
} from '@/styles/sessionTokens';
import { EffortGraph } from '@/components/workout/EffortGraph';
import type { CalendarSession } from '@/lib/api';
import type { CalendarItem } from '@/types/calendar';

// Unified session data interface that works with both CalendarSession and CalendarItem
interface SessionCardData {
  id: string;
  title: string;
  type: string;
  intensity?: string | null;
  duration_minutes?: number | null;
  distance_km?: number | null;
  status: 'planned' | 'completed' | 'skipped' | 'deleted' | 'missed';
  steps?: Array<{
    order?: number;
    name: string;
    duration_min?: number | null;
    distance_km?: number | null;
    intensity?: string | null;
    notes?: string | null;
  }>;
  coach_insight?: string | null;
  notes?: string | null;
  execution_notes?: string | null;
  must_dos?: string[];
}

interface SessionCardProps {
  /** Session data (CalendarSession or CalendarItem) */
  session: CalendarSession | CalendarItem;
  /** Density variant: compact (Calendar), standard (Today), rich (Training Plan) */
  density?: 'compact' | 'standard' | 'rich';
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Highlight this workout with glow effect */
  highlighted?: boolean;
}

/**
 * Converts CalendarSession to SessionCardData
 */
function sessionToCardData(session: CalendarSession): SessionCardData {
  return {
    id: session.id,
    title: session.title,
    type: session.type,
    intensity: session.intensity,
    duration_minutes: session.duration_minutes,
    distance_km: session.distance_km,
    status: session.status,
    steps: session.steps,
    coach_insight: session.coach_insight,
    notes: session.notes,
    execution_notes: session.execution_notes,
    must_dos: session.must_dos,
  };
}

/**
 * Converts CalendarItem to SessionCardData
 */
function itemToCardData(item: CalendarItem): SessionCardData {
  // Map CalendarItem kind to status
  let status: SessionCardData['status'] = 'planned';
  if (item.kind === 'completed') {
    status = 'completed';
  } else if (item.compliance === 'missed') {
    status = 'missed';
  }

  return {
    id: item.id,
    title: item.title,
    type: item.sport,
    intensity: item.intent,
    duration_minutes: item.durationMin,
    distance_km: item.distanceKm,
    status,
    coach_insight: item.coachNote?.text || item.description || null,
    notes: item.description || null,
    execution_notes: item.executionNotes || null,
    must_dos: item.mustDos,
  };
}

const sportIcons = {
  run: '🏃',
  ride: '🚴',
  swim: '🏊',
  strength: '💪',
  race: '🏁',
  other: '⚡',
} as const;

/**
 * Maps session type/intensity to intent label
 */
function getIntentLabel(intensity: string | null, type: string): string {
  if (!intensity) return type.toUpperCase();
  const lower = intensity.toLowerCase();
  if (lower.includes('threshold') || lower.includes('tempo')) return 'TEMPO';
  if (lower.includes('vo2') || lower.includes('interval')) return 'INTERVALS';
  if (lower.includes('endurance') || lower.includes('long')) return 'LONG';
  if (lower.includes('recovery') || lower.includes('easy')) return 'EASY';
  if (lower.includes('aerobic')) return 'AEROBIC';
  return intensity.toUpperCase();
}

/**
 * Gets status indicator icon
 */
function getStatusIcon(status: SessionCardData['status']) {
  switch (status) {
    case 'completed':
      return CheckCircle2;
    case 'skipped':
      return XCircle;
    case 'deleted':
      return Trash2;
    default:
      return null;
  }
}

/**
 * Generates effort profile based on workout intent/intensity
 * Same logic as DailyWorkoutCard for consistency
 */
function generatePlannedEffort(intent: string | null | undefined, numBars: number = 10): number[] {
  if (!intent) return Array.from({ length: numBars }, () => 3 + Math.random() * 2);
  
  const lower = intent.toLowerCase();
  
  if (lower.includes('interval') || lower.includes('vo2')) {
    return Array.from({ length: numBars }, (_, i) => 
      i % 2 === 0 ? 3 + Math.random() * 2 : 7 + Math.random() * 2
    );
  }
  
  if (lower.includes('tempo') || lower.includes('threshold')) {
    return Array.from({ length: numBars }, (_, i) => {
      if (i < 2) return 3 + Math.random() * 2;
      if (i >= numBars - 2) return 3 + Math.random() * 2;
      return 6 + Math.random() * 2;
    });
  }
  
  if (lower.includes('long') || lower.includes('endurance')) {
    return Array.from({ length: numBars }, (_, i) => {
      const progress = i / numBars;
      if (progress < 0.2) return 4 + progress * 5;
      if (progress > 0.8) return 5 + (1 - progress) * 3;
      return 5 + Math.random() * 1.5;
    });
  }
  
  return Array.from({ length: numBars }, () => 3 + Math.random() * 2);
}

export function SessionCard({
  session: sessionOrItem,
  density = 'standard',
  onClick,
  className,
  highlighted = false,
}: SessionCardProps) {
  // Normalize input - handle both CalendarSession and CalendarItem
  // Check if it's a CalendarSession by looking for 'status' field with specific values
  const isCalendarSession = 'status' in sessionOrItem && 
    typeof (sessionOrItem as CalendarSession).status === 'string' &&
    ['planned', 'completed', 'skipped', 'deleted', 'missed'].includes((sessionOrItem as CalendarSession).status);
  
  const session: SessionCardData = isCalendarSession
    ? sessionToCardData(sessionOrItem as CalendarSession)
    : itemToCardData(sessionOrItem as CalendarItem);
  const { convertDistance, formatDistance } = useUnitSystem();
  const spacing = sessionSpacing[density];
  const radius = sessionRadius[density];
  const fonts = sessionFontSizes[density];
  const statusColors = sessionStatusColors[session.status] || sessionStatusColors.planned;
  
  // Get intent/intensity for badge
  const intensity = session.intensity || session.type || null;
  const intent = intensity?.toLowerCase() || null;
  const intentColorClass = intent && intent in sessionIntentColors
    ? sessionIntentColors[intent as keyof typeof sessionIntentColors]
    : 'bg-muted text-muted-foreground border-border';
  
  // Normalize intent for stellar density (CalendarIntent type)
  const calendarIntent: CalendarIntent = normalizeCalendarIntent(intensity || session.type);
  
  // Determine if this should be highlighted (intent-based, prop overrides)
  const isHighlighted =
    highlighted ??
    (intent === 'long' ||
     intent === 'threshold' ||
     intent === 'vo2');

  // Format duration
  const formatDuration = (minutes: number | null | undefined): string => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Status icon
  const StatusIcon = getStatusIcon(session.status);
  const sportIcon = sportIcons[session.type?.toLowerCase() as keyof typeof sportIcons] || sportIcons.other;

  // Generate effort data for graph - always generate for compact density
  const effortData = density === 'compact' 
    ? generatePlannedEffort(session.intensity || session.type, 10)
    : null;
  // Show actual data only for completed sessions, otherwise show planned (muted)
  const showEffortData = density === 'compact' && session.status === 'completed';

  // Density rules: what to show/hide per density
  const showIntensityBadge = density !== 'compact';
  const showStatusBadge = density !== 'compact';
  const showStatusIconOnRight = density === 'compact' && StatusIcon;
  const showCoachInsight = density === 'standard' || density === 'rich';
  const showSteps = density === 'rich';
  const showBothDurationAndDistance = density !== 'compact';

  // Determine role based on highlighted state and intent
  const surfaceRole: 'ambient' | 'focus' = isHighlighted ? 'focus' : 'ambient';

  return (
    <WorkoutCardShell role={surfaceRole} intent={calendarIntent}>
      <div
        className={cn(
          'w-full',
          onClick && 'cursor-pointer',
          // Min height for compact density - prevents clipping while maintaining layout
          density === 'compact' && 'min-h-[88px] flex flex-col overflow-hidden',
          className
        )}
        onClick={onClick}
      >
      <div className={cn(
        'flex items-center justify-between',
        spacing.gap,
        // In compact mode, this is the top section above the graph
        density === 'compact' && 'flex-shrink-0'
      )}>
        {/* Left: Main content */}
        <div className={cn(
          'flex-1 min-w-0 flex flex-col justify-center',
          // Vertical spacing between title and metadata
          density === 'compact' ? 'space-y-1' : density === 'standard' ? 'space-y-1.5' : 'space-y-2'
        )}>
          {/* Title row */}
          <div className={cn('flex items-center flex-wrap', spacing.titleGap)}>
            <h3 className="text-sm font-semibold tracking-tight truncate text-white">
              {session.title || session.type || 'Workout'}
            </h3>
            {showIntensityBadge && intent && (
              <Badge variant="outline" className={cn(fonts.badge, intentColorClass)}>
                {getIntentLabel(intensity, session.type)}
              </Badge>
            )}
          </div>

          {/* Metadata row */}
          <div className={cn(
            'flex items-center flex-nowrap',
            spacing.metadataGap,
            fonts.metadata,
            'text-muted-foreground',
            // Fixed height for metadata row in compact mode
            density === 'compact' && 'h-4'
          )}>
            {/* Compact: Show duration OR distance (prefer duration) */}
            {density === 'compact' && (
              <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                {session.duration_minutes ? (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(session.duration_minutes)}</span>
                  </>
                ) : session.distance_km ? (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>{formatDistance(convertDistance(session.distance_km))}</span>
                  </>
                ) : null}
                {intent && (session.duration_minutes || session.distance_km) && (
                  <>
                    <span className="opacity-40">•</span>
                    <span className="uppercase tracking-wider opacity-60">
                      {getIntentLabel(intensity, session.type)}
                    </span>
                  </>
                )}
              </div>
            )}
            {/* Standard/Rich: Show both duration and distance */}
            {showBothDurationAndDistance && (
              <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
                {session.duration_minutes && (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(session.duration_minutes)}</span>
                  </>
                )}
                {session.duration_minutes && session.distance_km && (
                  <span className="opacity-40">•</span>
                )}
                {session.distance_km && (
                  <span>{formatDistance(convertDistance(session.distance_km))}</span>
                )}
              </div>
            )}
          </div>

          {/* Rich density: Step preview and coach insight */}
          {showSteps && (
            <div className="space-y-2 pt-1">
              {/* Step preview (1-2 lines max) */}
              {session.steps && session.steps.length > 0 && (
                <div
                  className={fonts.metadata}
                  style={{ color: 'rgba(148, 163, 184, 0.75)' }}
                >
                  {session.steps.slice(0, 2).map((step, idx) => (
                    <div key={idx} className="truncate">
                      {step.order || idx + 1}. {step.name || `Step ${idx + 1}`}
                    </div>
                  ))}
                  {session.steps.length > 2 && (
                    <span className="text-muted-foreground/60">
                      +{session.steps.length - 2} more
                    </span>
                  )}
                </div>
              )}

              {/* Coach insight teaser */}
              {session.coach_insight && (
                <p className="mt-2 text-xs line-clamp-2 text-white/60">
                  {session.coach_insight}
                </p>
              )}
            </div>
          )}

          {/* Standard density: Coach insight teaser (1 line max) */}
          {density === 'standard' && showCoachInsight && session.coach_insight && (
            <p className="mt-2 text-xs line-clamp-2 text-white/60">
              {session.coach_insight}
            </p>
          )}
        </div>

        {/* Right: Status indicator - consistent placement on right side across densities */}
        {showStatusIconOnRight && (
          <StatusIcon className={cn('h-4 w-4 shrink-0', statusColors.text)} />
        )}
        {showStatusBadge && (
          <Badge variant="outline" className={cn(fonts.badge, 'shrink-0', statusColors.badge)}>
            {session.status === 'completed' && 'Completed'}
            {session.status === 'skipped' && 'Skipped'}
            {session.status === 'deleted' && 'Deleted'}
            {session.status === 'missed' && 'Missed'}
            {session.status === 'planned' && 'Planned'}
          </Badge>
        )}
      </div>

      {/* Effort graph for compact density - always show if data exists */}
      {density === 'compact' && effortData && effortData.length > 0 && (
        <div className="h-[20px] mt-1.5 -mx-2 -mb-2 flex-shrink-0" style={{ minHeight: '20px' }}>
          <EffortGraph
            data={effortData}
            showData={showEffortData}
            compact
            onClick={undefined}
          />
        </div>
      )}
      </div>
    </WorkoutCardShell>
  );
}
