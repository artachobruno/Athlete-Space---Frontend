import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Route, Mountain, MessageCircle, ExternalLink, CheckCircle2, Loader2, TrendingUp, Zap, Heart } from 'lucide-react';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { cn } from '@/lib/utils';
import { NarrativeBlock } from './NarrativeBlock';
import type { CalendarSession } from '@/lib/api';
import type { CalendarItem } from '@/types/calendar';
import type { CompletedActivity } from '@/types';
import { WorkoutCardShell } from '@/components/sessions/WorkoutCardShell';
import { CardTypography } from '@/styles/cardTypography';
import { sessionStatusColors } from '@/styles/sessionTokens';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams, fetchTrainingLoad } from '@/lib/api';
import { fetchStructuredWorkout } from '@/api/workouts';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout';
import { ActivityMap } from '@/components/activities/ActivityMap';
import { ActivityCharts } from '@/components/activities/ActivityCharts';
import { WorkoutComparison } from './WorkoutComparison';
import { WorkoutStepsTable } from './WorkoutStepsTable';
import { normalizeRoutePointsFromStreams } from '@/lib/route-utils';
import { getTssForDate, enrichActivitiesWithTss } from '@/lib/tss-utils';
import { useMemo, useState } from 'react';

interface WorkoutDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: CalendarSession | null;
  item?: CalendarItem | null;
  activity?: CompletedActivity | null;
  onAskCoach?: (context: string) => void;
}

/**
 * Gets intent label for zone badge
 */
function getIntentLabel(intensity: string | null | undefined, type: string): string {
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
 * Derives zone badge colors based on intent
 */
function getZoneColors(intent: string | null | undefined) {
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

  return { zoneBgColor, zoneTextColor };
}

/**
 * Derives intent text from session/item
 */
function deriveIntentText(session?: CalendarSession | null, item?: CalendarItem | null): string | undefined {
  if (item?.description) return item.description;
  if (session?.notes) return session.notes;
  return undefined;
}

/**
 * Derives execution summary from item/activity
 */
function deriveExecutionSummary(item?: CalendarItem | null, activity?: CompletedActivity | null): string | undefined {
  if (item?.executionNotes) return item.executionNotes;
  if (item?.compliance === 'complete') return 'On target — matched plan.';
  if (item?.compliance === 'partial') return 'Completed with reduced volume.';
  if (item?.compliance === 'missed') return 'Missed due to schedule or fatigue.';
  if (activity?.coachFeedback) return activity.coachFeedback;
  return undefined;
}

export function WorkoutDetailModal({
  open,
  onOpenChange,
  session,
  item,
  activity,
  onAskCoach,
}: WorkoutDetailModalProps) {
  const navigate = useNavigate();
  const { convertDistance, convertElevation } = useUnitSystem();

  // Determine status
  const status = session?.status || (item?.kind === 'completed' ? 'completed' : 'planned');
  const isPlanned = status === 'planned';
  const isCompleted = status === 'completed';
  const isUnplanned = isCompleted && !item?.isPaired && !session?.completed_activity_id;

  // Detect hero sessions (long runs/races) for enhanced display
  const isHeroSession = 
    item?.sport === 'race' || 
    item?.intent === 'long' ||
    intensity?.toLowerCase().includes('long') ||
    title.toLowerCase().includes('long') ||
    title.toLowerCase().includes('race');

  // Get title
  const title = session?.title || item?.title || activity?.title || 'Workout';

  // Get intent/intensity
  const intensity = session?.intensity || item?.intent || undefined;
  const zoneLabel = getIntentLabel(intensity, session?.type || item?.sport || 'other');
  const { zoneBgColor, zoneTextColor } = getZoneColors(intensity);

  // Get status colors
  const statusColors = sessionStatusColors[status] || sessionStatusColors.planned;

  // Get metrics
  const duration = session?.duration_minutes || item?.durationMin || activity?.duration || null;
  const distance = session?.distance_km || item?.distanceKm || activity?.distance || null;
  const elevation = activity?.elevation || null;

  // Narrative data
  const intentText = deriveIntentText(session, item);
  const executionSummary = deriveExecutionSummary(item, activity);
  const coachInsight = item?.coachNote ? {
    text: item.coachNote.text,
    tone: item.coachNote.tone,
  } : undefined;

  // Get workout ID for structured workout data
  const workoutId = session?.workout_id || activity?.workout_id || undefined;
  const structuredWorkoutState = useStructuredWorkout(workoutId);
  const structuredWorkout = structuredWorkoutState.status === 'ready' ? structuredWorkoutState.data : null;

  // Fetch activity streams for map and charts
  const { data: streamsData, isLoading: streamsLoading, error: streamsError } = useQuery({
    queryKey: ['activityStreams', activity?.id],
    queryFn: () => fetchActivityStreams(activity!.id),
    retry: false,
    enabled: !!activity?.id && open,
  });

  // Process route coordinates from streams
  const routeCoordinates = useMemo<[number, number][] | undefined>(() => {
    if (streamsError || !streamsData) return undefined;
    const coords = normalizeRoutePointsFromStreams(streamsData);
    return coords.length === 0 ? undefined : coords;
  }, [streamsData, streamsError]);

  // Fetch training load for TSS
  const { data: trainingLoadData } = useQuery({
    queryKey: ['trainingLoad', 60],
    queryFn: () => fetchTrainingLoad(60),
    retry: 1,
    enabled: open && !!activity?.date,
    staleTime: 0,
  });

  // Get TSS for display
  const displayTss = activity?.trainingLoad || 
    (activity?.date ? getTssForDate(activity.date, trainingLoadData) : null);

  // Get comparison data from structured workout (if available)
  const comparison = structuredWorkout?.comparison;

  // Chart type toggle state
  const [chartType, setChartType] = useState<'pace' | 'hr' | 'elevation' | 'power'>('pace');

  const handleStartSession = () => {
    // TODO: Implement start session logic
    onOpenChange(false);
  };

  const handleViewFullAnalysis = () => {
    if (activity?.id) {
      navigate(`/history?activity=${activity.id}`);
    } else {
      navigate('/history');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-transparent border-0">
        <WorkoutCardShell role="modal" padding="p-0">
          <div className="border-0 shadow-none bg-transparent">
            {/* ============ HEADER ============ */}
            <div className="pb-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 
                  className="flex-1 line-clamp-2"
                  style={CardTypography.title}
                >
                  {title}
                </h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Zone badge */}
                  {intensity && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap"
                      style={{
                        backgroundColor: zoneBgColor,
                        color: zoneTextColor,
                      }}
                    >
                      {zoneLabel}
                    </span>
                  )}
                  {/* Status badge */}
                  <Badge variant="outline" className={cn('text-[10px]', statusColors.badge)}>
                    {status === 'completed' && 'Completed'}
                    {status === 'skipped' && 'Skipped'}
                    {status === 'deleted' && 'Deleted'}
                    {status === 'missed' && 'Missed'}
                    {status === 'planned' && 'Planned'}
                  </Badge>
                  {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
                </div>
              </div>

              {/* Summary metrics */}
              <div className="flex items-center gap-4" style={CardTypography.stat}>
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 opacity-60" />
                    {duration}m
                  </span>
                )}
                {distance && (
                  <span className="flex items-center gap-1">
                    <Route className="w-3 h-3 opacity-60" />
                    {(() => {
                      const dist = convertDistance(distance);
                      return `${dist.value.toFixed(1)} ${dist.unit}`;
                    })()}
                  </span>
                )}
                {elevation && (
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3 h-3 opacity-60" />
                    {(() => {
                      const elev = convertElevation(elevation);
                      return `${elev.value.toFixed(1)} ${elev.unit}`;
                    })()}
                  </span>
                )}
              </div>
            </div>

            {/* ============ NARRATIVE BLOCK ============ */}
            <div className={cn(
              "pt-0",
              isHeroSession ? "pb-6 space-y-6" : "pb-4"
            )}>
              <NarrativeBlock
                intentText={intentText}
                executionSummary={executionSummary}
                coachInsight={coachInsight}
                status={status}
                isUnplanned={isUnplanned}
                isHeroSession={isHeroSession}
              />
            </div>

            {/* ============ TABS ============ */}
            <Tabs defaultValue={isHeroSession ? "structure" : "overview"} className="w-full">
              <TabsList className="w-full grid grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
                <TabsTrigger value="structure">Structure</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* TSS / Load */}
                  {displayTss !== null && displayTss > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">TSS</div>
                      <div className="text-sm font-medium text-foreground">{Math.round(displayTss)}</div>
                    </div>
                  )}
                  
                  {/* Intensity Factor */}
                  {activity?.intensityFactor !== undefined && activity.intensityFactor !== null && (
                    <div className={cn(
                      "p-3 rounded-lg bg-muted/50",
                      activity.intensityFactor >= 1.0 && "ring-2 ring-load-overreaching/30"
                    )}>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Intensity Factor
                      </div>
                      <div className={cn(
                        "text-sm font-medium",
                        activity.intensityFactor >= 1.0 
                          ? "text-load-overreaching" 
                          : "text-foreground"
                      )}>
                        {activity.intensityFactor.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Elevation gain */}
                  {elevation && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Mountain className="h-3 w-3" />
                        Elevation Gain
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {(() => {
                          const elev = convertElevation(elevation);
                          return `${elev.value.toFixed(1)} ${elev.unit}`;
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Compliance indicator */}
                  {item?.compliance && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Compliance</div>
                      <div className="text-sm font-medium text-foreground capitalize">
                        {item.compliance}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="map" className="mt-4">
                <div className="rounded-lg overflow-hidden border border-border">
                  {streamsLoading ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  ) : streamsError ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <span className="text-sm">Route unavailable</span>
                    </div>
                  ) : (
                    <ActivityMap coordinates={routeCoordinates} />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="charts" className="mt-4">
                {activity ? (
                  <div className="space-y-4">
                    {/* Chart type selector */}
                    <div className="flex gap-2">
                      {['pace', 'hr', 'elevation', 'power'].map((type) => (
                        <Button
                          key={type}
                          variant={chartType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setChartType(type as typeof chartType)}
                          className="text-xs"
                        >
                          {type === 'pace' && 'Pace'}
                          {type === 'hr' && 'Heart Rate'}
                          {type === 'elevation' && 'Elevation'}
                          {type === 'power' && 'Power'}
                        </Button>
                      ))}
                    </div>
                    {/* Chart display - ActivityCharts handles all chart types */}
                    <ActivityCharts activity={activity} />
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No activity data available
                  </div>
                )}
              </TabsContent>

              <TabsContent value="structure" className="mt-4">
                {isPlanned ? (
                  // Planned: show step targets
                  structuredWorkout?.steps ? (
                    <WorkoutStepsTable steps={structuredWorkout.steps} />
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No structured workout data available
                    </div>
                  )
                ) : (
                  // Completed: show planned vs actual comparison
                  structuredWorkout?.steps && comparison && Array.isArray(comparison) && comparison.length > 0 ? (
                    <WorkoutComparison
                      steps={structuredWorkout.steps}
                      comparison={comparison}
                      totalDistanceMeters={structuredWorkout.workout.total_distance_meters}
                      totalDurationSeconds={structuredWorkout.workout.total_duration_seconds}
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      {structuredWorkoutState.status === 'loading' ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                      ) : (
                        'No execution data available'
                      )}
                    </div>
                  )
                )}
              </TabsContent>

              <TabsContent value="notes" className="mt-4">
                <div className="space-y-4">
                  {/* Athlete notes */}
                  {session?.notes && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Athlete Notes
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {session.notes}
                      </p>
                    </div>
                  )}

                  {/* Coach comments */}
                  {session?.coach_insight && (
                    <div>
                      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                        Coach Comments
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">
                        {session.coach_insight}
                      </p>
                    </div>
                  )}

                  {!session?.notes && !session?.coach_insight && (
                    <div className="text-sm text-muted-foreground text-center py-8">
                      No notes available
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* ============ FOOTER ACTIONS ============ */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              {isPlanned ? (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onAskCoach?.(title);
                      onOpenChange(false);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask Coach to Modify
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleStartSession}
                  >
                    Start Session
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      onAskCoach?.(title);
                      onOpenChange(false);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ask Coach About This
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={handleViewFullAnalysis}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Full Analysis
                  </Button>
                </>
              )}
            </div>
          </div>
        </WorkoutCardShell>
      </DialogContent>
    </Dialog>
  );
}
