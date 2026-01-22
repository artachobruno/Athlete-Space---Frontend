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

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Route, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { cn } from '@/lib/utils';
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

  // Generate effort data for graph
  const effortData = density === 'compact' 
    ? generatePlannedEffort(session.intensity || session.type, 10)
    : null;
  const showEffortData = density === 'compact' && session.status === 'completed';

  return (
    <Card
      className={cn(
        radius,
        spacing.padding,
        statusColors.border,
        statusColors.background,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow',
        // Fixed height for compact density - increased to accommodate graph
        density === 'compact' && 'h-[100px] flex flex-col',
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
          // Use consistent spacing for compact, tighter for others
          density === 'compact' ? 'space-y-1' : 'space-y-1.5'
        )}>
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn('font-semibold truncate', fonts.title, statusColors.text)}>
              {session.title || session.type || 'Workout'}
            </h3>
            {intent && density !== 'compact' && (
              <Badge variant="outline" className={cn('text-xs', intentColorClass)}>
                {getIntentLabel(intensity, session.type)}
              </Badge>
            )}
            {StatusIcon && density !== 'compact' && (
              <StatusIcon className={cn('h-4 w-4', statusColors.text)} />
            )}
          </div>

          {/* Metadata row */}
          <div className={cn(
            'flex items-center gap-3',
            fonts.metadata,
            'text-muted-foreground',
            // Fixed height for metadata row in compact mode
            density === 'compact' && 'h-4'
          )}>
            {session.duration_minutes && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatDuration(session.duration_minutes)}</span>
              </div>
            )}
            {session.distance_km && (
              <div className="flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5" />
                <span>{formatDistance(convertDistance(session.distance_km))}</span>
              </div>
            )}
            {density === 'compact' && intent && (
              <span className="text-[10px] uppercase tracking-wider opacity-60">
                {getIntentLabel(intensity, session.type)}
              </span>
            )}
          </div>

          {/* Rich density: Step preview and coach insight */}
          {density === 'rich' && (
            <div className="space-y-2 pt-1">
              {/* Step preview (1-2 lines max) */}
              {session.steps && session.steps.length > 0 && (
                <div className="text-xs text-muted-foreground">
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
                <div className="text-xs text-muted-foreground italic line-clamp-2">
                  {session.coach_insight}
                </div>
              )}
            </div>
          )}

          {/* Standard density: Small effort indicator or coach insight */}
          {density === 'standard' && session.coach_insight && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {session.coach_insight}
            </div>
          )}
        </div>

        {/* Right: Status indicator (compact shows icon only, others show badge) */}
        {density === 'compact' && StatusIcon && (
          <StatusIcon className={cn('h-4 w-4 shrink-0', statusColors.text)} />
        )}
        {density !== 'compact' && (
          <Badge variant="outline" className={cn('text-xs shrink-0', statusColors.badge)}>
            {session.status === 'completed' && 'Completed'}
            {session.status === 'skipped' && 'Skipped'}
            {session.status === 'deleted' && 'Deleted'}
            {session.status === 'missed' && 'Missed'}
            {session.status === 'planned' && 'Planned'}
          </Badge>
        )}
      </div>

      {/* Effort graph for compact density */}
      {density === 'compact' && effortData && effortData.length > 0 && (
        <div className="flex-1 min-h-0 mt-1.5">
          <EffortGraph
            data={effortData}
            showData={showEffortData}
            compact={true}
            onClick={onClick}
          />
        </div>
      )}
    </Card>
  );
}
