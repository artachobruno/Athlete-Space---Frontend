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
  sessionStatusColors,
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
  /** Intent narrative for planned sessions */
  intent_text?: string | null;
  /** Whether this is an unplanned completed activity */
  is_unplanned?: boolean;
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
  /** Hide effort graph (for month view) */
  hideEffortGraph?: boolean;
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
  const isCompleted = item.kind === 'completed';
  if (isCompleted) {
    status = 'completed';
  } else if (item.compliance === 'missed') {
    status = 'missed';
  }

  // Determine if this is an unplanned activity (completed but not paired with a plan)
  const isUnplanned = isCompleted && !item.isPaired;

  // Map coachNote from CalendarItem to coach_insight
  const coach_insight = item.coachNote?.text || null;
  
  // Intent text for planned sessions (from description or derive from intent)
  const intent_text = !isCompleted ? (item.description || deriveIntentNarrative(item.intent)) : null;
  
  return {
    id: item.id,
    title: item.title,
    type: item.sport,
    intensity: item.intent,
    duration_minutes: item.durationMin,
    distance_km: item.distanceKm,
    status,
    coach_insight,
    notes: item.description || null,
    execution_notes: item.executionNotes || null,
    must_dos: item.mustDos,
    intent_text,
    is_unplanned: isUnplanned,
  };
}

/**
 * Derives intent narrative from intensity/intent string
 */
function deriveIntentNarrative(intent: string | undefined): string | null {
  if (!intent) return null;
  const lower = intent.toLowerCase();
  
  if (lower.includes('easy') || lower.includes('recovery')) {
    return 'Focus on relaxed effort and full recovery.';
  }
  if (lower.includes('threshold') || lower.includes('tempo')) {
    return 'Build lactate threshold with sustained effort.';
  }
  if (lower.includes('vo2') || lower.includes('interval')) {
    return 'Push VO2max with high-intensity intervals.';
  }
  if (lower.includes('long') || lower.includes('endurance')) {
    return 'Build endurance with extended duration.';
  }
  if (lower.includes('aerobic')) {
    return 'Develop aerobic base with steady effort.';
  }
  return null;
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
  hideEffortGraph = false,
}: SessionCardProps) {
  // Normalize input - handle both CalendarSession and CalendarItem
  // Check if it's a CalendarSession by looking for 'status' field with specific values
  const isCalendarSession = 'status' in sessionOrItem && 
    typeof (sessionOrItem as CalendarSession).status === 'string' &&
    ['planned', 'completed', 'skipped', 'deleted', 'missed'].includes((sessionOrItem as CalendarSession).status);
  
  const session: SessionCardData = isCalendarSession
    ? sessionToCardData(sessionOrItem as CalendarSession)
    : itemToCardData(sessionOrItem as CalendarItem);
  
  // Debug logging
  if (session.coach_insight) {
    console.log('[SessionCard] Has coach_insight:', {
      sessionId: session.id,
      status: session.status,
      coach_insight_length: session.coach_insight.length,
      coach_insight_preview: session.coach_insight.substring(0, 100),
      isCalendarSession,
    });
  } else {
    console.log('[SessionCard] NO coach_insight:', {
      sessionId: session.id,
      status: session.status,
      isCalendarSession,
      rawData: isCalendarSession 
        ? (sessionOrItem as CalendarSession).coach_insight 
        : (sessionOrItem as CalendarItem).coachNote?.text,
    });
  }
  
  const { convertDistance, formatDistance } = useUnitSystem();
  const statusColors = sessionStatusColors[session.status] || sessionStatusColors.planned;
  
  // Get intent/intensity for badge
  const intensity = session.intensity || session.type || null;
  const intent = intensity?.toLowerCase() || null;
  
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

  // Generate effort data for graph - always generate for compact density
  const effortData = density === 'compact' 
    ? generatePlannedEffort(session.intensity || session.type, 10)
    : null;
  // Show actual data only for completed sessions, otherwise show planned (muted)
  const showEffortData = density === 'compact' && session.status === 'completed';

  // === Target Anatomy Rules ===
  // HEADER: Title + Status/Zone inline
  // META: Duration, Distance, Effort (immediately below header)
  // BODY: Intent (planned) OR Execution + Coach (completed) - NEVER MIXED
  // FOOTER: CTA unchanged

  // Visibility matrix
  const isPlanned = session.status === 'planned';
  const isCompleted = session.status === 'completed';
  const isUnplanned = session.is_unplanned && isCompleted;
  
  // Body content rules (never show both intent and execution)
  // Compact shows 1-line truncated text; standard/rich shows full text
  const showIntentText = isPlanned && session.intent_text;
  const showExecutionSummary = isCompleted && session.execution_notes && (density === 'standard' || density === 'rich');
  // Show coach insight for both planned (pre-workout guidance) and completed (post-workout analysis)
  const showCoachInsight = session.coach_insight;  // Show for all sessions with coach feedback
  const showSteps = density === 'rich' && isPlanned;

  // Determine role based on highlighted state and intent
  const surfaceRole: 'ambient' | 'focus' = isHighlighted ? 'focus' : 'ambient';

  // Get intent label for zone badge
  const zoneLabel = getIntentLabel(intensity, session.type);
  const intentLower = intent?.toLowerCase() || '';
  const isEasyZone = intentLower === 'easy' || intentLower === 'recovery' || intentLower === 'aerobic';
  const isModerateZone = intentLower === 'threshold' || intentLower === 'tempo' || intentLower === 'endurance';
  const isHardZone = intentLower === 'vo2' || intentLower === 'intervals';
  
  const zoneBgColor = isEasyZone
    ? 'rgba(52,211,153,0.18)'
    : isModerateZone
    ? 'rgba(251,191,36,0.18)'
    : isHardZone
    ? 'rgba(239,68,68,0.18)'
    : 'rgba(148,163,184,0.18)';
  
  const zoneTextColor = isEasyZone
    ? '#6EE7B7'
    : isModerateZone
    ? '#FBBF24'
    : isHardZone
    ? '#FCA5A5'
    : '#94A3B8';

  // ==================== COMPACT DENSITY (Week View) ====================
  // Clean 4-row layout: Badges | Title | Time · Distance | Coach Feedback
  if (density === 'compact') {
    const durationStr = formatDuration(session.duration_minutes);
    const distanceStr = session.distance_km 
      ? formatDistance(convertDistance(session.distance_km)) 
      : null;
    
    return (
      <WorkoutCardShell role={surfaceRole} intent={calendarIntent}>
        <div
          className={cn(
            'w-full overflow-hidden',
            onClick && 'cursor-pointer',
            className
          )}
          onClick={onClick}
        >
          {/* Row 1: Status Badges (e.g., EASY Done) */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge 
              variant="outline" 
              className="text-[10px] px-1.5 py-0.5 h-5 font-medium whitespace-nowrap shrink-0"
            >
              {zoneLabel}
            </Badge>
            {session.status === 'completed' && (
              <Badge 
                variant="outline" 
                className="text-[10px] px-1.5 py-0.5 h-5 font-medium whitespace-nowrap shrink-0 text-load-fresh border-load-fresh/30"
              >
                Done
              </Badge>
            )}
          </div>

          {/* Row 2: Title */}
          <p className="font-medium text-foreground text-sm leading-tight truncate mb-1">
            {session.title || session.type || 'Workout'}
          </p>

          {/* Row 3: Time · Distance */}
          {(durationStr || distanceStr) && (
            <p className="text-muted-foreground text-xs truncate mb-1">
              {durationStr}
              {durationStr && distanceStr && ' · '}
              {distanceStr}
            </p>
          )}

          {/* Row 4: Coach Feedback */}
          {session.coach_insight && (
            <p className="text-xs leading-snug text-muted-foreground line-clamp-2">
              {session.coach_insight}
            </p>
          )}
        </div>
      </WorkoutCardShell>
    );
  }

  // ==================== STANDARD / RICH DENSITY ====================
  return (
    <WorkoutCardShell role={surfaceRole} intent={calendarIntent}>
      <div
        className={cn(
          'w-full',
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
      >
        {/* ============ HEADER: Title + Status/Zone ============ */}
        <div className="flex items-start justify-between gap-2">
          {/* Title (left, largest) */}
          <h3 
            className="flex-1 min-w-0 line-clamp-2"
            style={CardTypography.title}
          >
            {session.title || session.type || 'Workout'}
          </h3>

          {/* Status/Zone (right, inline with title) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Zone badge */}
            {intent && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide max-w-[80px] truncate"
                style={{
                  backgroundColor: zoneBgColor,
                  color: zoneTextColor,
                }}
                title={zoneLabel}
              >
                {zoneLabel}
              </span>
            )}
            
            {/* Status badge */}
            <Badge 
              variant="outline" 
              className={cn(
                'text-[10px] max-w-[70px] truncate',
                statusColors.badge
              )}
              title={session.status === 'completed' ? 'Completed' : session.status}
            >
              {session.status === 'completed' && 'Done'}
              {session.status === 'skipped' && 'Skipped'}
              {session.status === 'deleted' && 'Deleted'}
              {session.status === 'missed' && 'Missed'}
              {session.status === 'planned' && 'Planned'}
            </Badge>
          </div>
        </div>

        {/* ============ META: Duration, Distance ============ */}
        <div 
          className="flex items-center gap-3 mt-[5px]"
          style={CardTypography.stat}
        >
          {session.duration_minutes && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 opacity-60" />
              <span>{formatDuration(session.duration_minutes)}</span>
            </span>
          )}
          {session.distance_km && (
            <span className="flex items-center gap-1">
              <Route className="w-3 h-3 opacity-60" />
              <span>{formatDistance(convertDistance(session.distance_km))}</span>
            </span>
          )}
        </div>

        {/* ============ BODY: Intent OR Execution (never mixed) ============ */}
        {(showIntentText || showExecutionSummary || showSteps || showCoachInsight) && (
          <div className="mt-[7px] space-y-2">
            {/* PLANNED: Intent narrative */}
            {showIntentText && (
              <p 
                className="opacity-80 line-clamp-2"
                style={CardTypography.description}
              >
                {session.intent_text}
              </p>
            )}

            {/* PLANNED: Step preview for rich density */}
            {showSteps && session.steps && session.steps.length > 0 && (
              <div style={CardTypography.description} className="opacity-70">
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

            {/* COMPLETED: Unplanned label */}
            {isUnplanned && (
              <span 
                className="text-[9px] font-semibold uppercase tracking-wider opacity-60"
                style={CardTypography.stat}
              >
                Unplanned Activity
              </span>
            )}

            {/* COMPLETED: Execution summary (1 line max) */}
            {showExecutionSummary && session.execution_notes && (
              <p 
                className="truncate opacity-80"
                style={CardTypography.description}
              >
                {session.execution_notes}
              </p>
            )}

            {/* Coach insight (for both planned and completed sessions) */}
            {showCoachInsight && (
              <p 
                className="line-clamp-2 opacity-60"
                style={CardTypography.description}
              >
                {session.coach_insight}
              </p>
            )}
          </div>
        )}
      </div>
    </WorkoutCardShell>
  );
}
