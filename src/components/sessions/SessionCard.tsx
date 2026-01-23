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
import { CardTypography } from '@/styles/cardTypography';
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
        'flex items-start justify-between',
        // In compact mode, this is the top section above the graph
        density === 'compact' && 'flex-shrink-0'
      )}>
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Header: Title and Duration on same row (standard/rich) or Title only (compact) */}
          {density === 'compact' ? (
            <h3 
              className="truncate mb-[6px]"
              style={CardTypography.titleCompact}
            >
              {session.title || session.type || 'Workout'}
            </h3>
          ) : (
            <div className="flex justify-between items-start mb-[6px]">
              <h3 
                className="line-clamp-2 flex-1"
                style={CardTypography.title}
              >
                {session.title || session.type || 'Workout'}
              </h3>
              {session.duration_minutes && (
                <span 
                  className="ml-2 flex-shrink-0 text-[13px] text-white/60 whitespace-nowrap"
                >
                  {formatDuration(session.duration_minutes)}
                </span>
              )}
            </div>
          )}

          {/* Meta chip row (EASY/MODERATE) - only for standard/rich */}
          {showIntensityBadge && intent && (() => {
            const intentLower = intent.toLowerCase();
            const isEasy = intentLower === 'easy' || intentLower === 'recovery' || intentLower === 'aerobic';
            const isModerate = intentLower === 'threshold' || intentLower === 'tempo' || intentLower === 'endurance';
            const isHard = intentLower === 'vo2' || intentLower === 'intervals';
            
            return (
              <div className="mb-[8px]">
                <span
                  className="px-2 py-0.5 rounded-full inline-block"
                  style={{
                    ...CardTypography.metaChip,
                    backgroundColor: isEasy
                      ? 'rgba(52,211,153,0.18)' 
                      : isModerate
                      ? 'rgba(251,191,36,0.18)'
                      : isHard
                      ? 'rgba(239,68,68,0.18)'
                      : 'rgba(148,163,184,0.18)',
                    color: isEasy
                      ? '#6EE7B7'
                      : isModerate
                      ? '#FBBF24'
                      : isHard
                      ? '#FCA5A5'
                      : '#94A3B8',
                  }}
                >
                  {getIntentLabel(intensity, session.type).toUpperCase()}
                </span>
              </div>
            );
          })()}

          {/* Stats row - duration/distance with icons */}
          {density === 'compact' ? (
            <div className="flex items-center gap-2" style={CardTypography.stat}>
              {session.duration_minutes ? (
                <>
                  <Clock className="w-3 h-3 opacity-60" />
                  <span>{formatDuration(session.duration_minutes)}</span>
                </>
              ) : session.distance_km ? (
                <>
                  <Route className="w-3 h-3 opacity-60" />
                  <span>{formatDistance(convertDistance(session.distance_km))}</span>
                </>
              ) : null}
            </div>
          ) : showBothDurationAndDistance && (
            <div className="flex items-center gap-4 mb-[10px]" style={CardTypography.stat}>
              {session.duration_minutes && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 opacity-60" />
                  {formatDuration(session.duration_minutes)}
                </span>
              )}
              {session.distance_km && (
                <span className="flex items-center gap-1">
                  <Route className="w-3 h-3 opacity-60" />
                  {formatDistance(convertDistance(session.distance_km))}
                </span>
              )}
            </div>
          )}

          {/* Rich density: Step preview and coach insight */}
          {showSteps && (
            <div className="mt-[12px]">
              {/* Step preview (1-2 lines max) */}
              {session.steps && session.steps.length > 0 && (
                <div style={CardTypography.description}>
                  {session.steps.slice(0, 2).map((step, idx) => (
                    <div key={idx} className="truncate">
                      {step.order || idx + 1}. {step.name || `Step ${idx + 1}`}
                    </div>
                  ))}
                  {session.steps.length > 2 && (
                    <span className="opacity-60">
                      +{session.steps.length - 2} more
                    </span>
                  )}
                </div>
              )}

              {/* Coach insight teaser */}
              {session.coach_insight && (
                <p className="mt-[10px] max-w-[85%]" style={CardTypography.description}>
                  {session.coach_insight}
                </p>
              )}
            </div>
          )}

          {/* Standard density: Coach insight teaser (optional) */}
          {density === 'standard' && showCoachInsight && session.coach_insight && (
            <p className="mt-[10px] max-w-[85%]" style={CardTypography.description}>
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
