import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Footprints, Bike, Waves, Clock, Route, Mountain, Heart, Zap, MessageCircle, CheckCircle2, ExternalLink, X, SkipForward, TrendingUp, Info, Download, Loader2, ArrowRight, Link2, Bot } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTrainingLoad, type CalendarSession, type ProposalOnlyResponse, exportWorkoutToFIT, fetchActivities, fetchActivityStreams } from '@/lib/api';
import { fetchStructuredWorkout } from '@/api/workouts';
import { useMemo, useState } from 'react';
import { getTssForDate, enrichActivitiesWithTss } from '@/lib/tss-utils';
import { toast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/confirmation/ConfirmationDialog';
import { checkForProposalResponse } from '@/lib/confirmation-handler';
import { useUpdateSessionStatus } from '@/hooks/useCalendarMutations';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { parseISO, format } from 'date-fns';
import { normalizeSportType } from '@/lib/session-utils';
import { ActivityCharts } from '@/components/activities/ActivityCharts';
import { ActivityMap } from '@/components/activities/ActivityMap';
import { normalizeRoutePointsFromStreams } from '@/lib/route-utils';

interface ActivityPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plannedWorkout?: PlannedWorkout | null;
  completedActivity?: CompletedActivity | null;
  session?: CalendarSession | null;
  onAskCoach?: (context: string) => void;
  onStatusChange?: () => void;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
};

const intentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
};

const structureTypeColors = {
  warmup: 'bg-training-recovery/20 text-training-recovery',
  main: 'bg-training-aerobic/20 text-training-aerobic',
  cooldown: 'bg-training-recovery/20 text-training-recovery',
  interval: 'bg-training-vo2/20 text-training-vo2',
  recovery: 'bg-muted text-muted-foreground',
};

// Telemetry sparkline component - thin signal trace
function TelemetrySparkline({ 
  data, 
  color, 
  height = 24,
}: { 
  data: number[]; 
  color: string; 
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  
  const width = 100;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="opacity-80">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Metric row component for detailed view
function TelemetryMetricRow({
  label,
  value,
  unit,
  sparkData,
  sparkColor = 'hsl(var(--accent))',
}: {
  label: string;
  value: string | number;
  unit?: string;
  sparkData?: number[];
  sparkColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground w-14">
          {label}
        </span>
        {sparkData && sparkData.length > 2 && (
          <TelemetrySparkline data={sparkData} color={sparkColor} />
        )}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-base font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

export function ActivityPopup({ 
  open, 
  onOpenChange, 
  plannedWorkout, 
  completedActivity,
  session,
  onAskCoach,
  onStatusChange
}: ActivityPopupProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateSessionStatus();
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    proposal: ProposalOnlyResponse;
    status: 'completed' | 'skipped' | 'cancelled';
  } | null>(null);
  const { convertDistance, convertElevation, convertPace } = useUnitSystem();
  const workout = plannedWorkout;
  const activity = completedActivity;
  const SportIcon = sportIcons[workout?.sport || activity?.sport || 'running'];
  const [isExporting, setIsExporting] = useState(false);
  const [showLinkActivity, setShowLinkActivity] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  
  // FE-3: Remove invalid filters - check if this is a session that can be updated
  const isPlannedSession = session && session.status !== 'completed' && session.status !== 'cancelled' && session.status !== 'skipped' && !activity;
  
  // Check if session is completed but has no linked activity
  const isCompletedWithoutActivity = session && session.status === 'completed' && !session.completed_activity_id && !activity;
  
  // Fetch activities for the same date when showing link selector
  const sessionDate = session?.date ? parseISO(session.date) : null;
  const sessionDateStr = sessionDate ? format(sessionDate, 'yyyy-MM-dd') : null;
  const sessionSport = session?.type ? normalizeSportType(session.type) : null;
  
  const { data: activitiesForLinking } = useAuthenticatedQuery({
    queryKey: ['activities', 'link', sessionDateStr],
    queryFn: () => sessionDateStr ? fetchActivities({ 
      start: sessionDateStr, 
      end: sessionDateStr,
      limit: 100 
    }) : Promise.resolve([]),
    enabled: isCompletedWithoutActivity && showLinkActivity && !!sessionDateStr,
    retry: 1,
  });
  
  // Filter activities by sport type
  const matchingActivities = useMemo(() => {
    if (!activitiesForLinking || !sessionSport) return [];
    return activitiesForLinking.filter(a => {
      const activitySport = normalizeSportType(a.sport);
      return activitySport === sessionSport && !a.planned_session_id; // Only unpaired activities
    });
  }, [activitiesForLinking, sessionSport]);

  // Fetch structured workout data only if session has a workout_id
  // Only call /workouts/{id}/structured if workout_id != null
  const { data: structuredWorkout } = useAuthenticatedQuery({
    queryKey: ['structuredWorkout', session?.workout_id],
    queryFn: () => {
      if (!session?.workout_id) throw new Error('No workout ID');
      return fetchStructuredWorkout(session.workout_id);
    },
    enabled: !!session?.workout_id && open,
    retry: 1,
  });

  const canExport = structuredWorkout && structuredWorkout.workout?.parse_status === 'parsed' && structuredWorkout.workout;

  // Fetch activity streams for detailed view (map, charts, sparklines)
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

  // Generate sparkline data from streams
  const hrSparkData = useMemo(() => {
    if (!streamsData?.heartrate) return undefined;
    const hr = (streamsData.heartrate as number[]).filter((v): v is number => typeof v === 'number');
    if (hr.length < 10) return undefined;
    const step = Math.max(1, Math.floor(hr.length / 30));
    return hr.filter((_, i) => i % step === 0);
  }, [streamsData]);

  const paceSparkData = useMemo(() => {
    if (!streamsData?.pace) return undefined;
    const pace = (streamsData.pace as number[]).filter((v): v is number => typeof v === 'number' && v > 0);
    if (pace.length < 10) return undefined;
    const step = Math.max(1, Math.floor(pace.length / 30));
    return pace.filter((_, i) => i % step === 0);
  }, [streamsData]);

  const elevSparkData = useMemo(() => {
    if (!streamsData?.elevation) return undefined;
    const elev = (streamsData.elevation as number[]).filter((v): v is number => typeof v === 'number');
    if (elev.length < 10) return undefined;
    const step = Math.max(1, Math.floor(elev.length / 30));
    return elev.filter((_, i) => i % step === 0);
  }, [streamsData]);

  const handleExportFIT = async () => {
    if (!session?.id || !canExport) return;

    setIsExporting(true);
    try {
      const blob = await exportWorkoutToFIT(session.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workout-${session.id}.fit`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Workout exported',
        description: 'Garmin FIT file downloaded successfully',
      });
    } catch (error) {
      console.error('Failed to export workout:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export workout to Garmin FIT format',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Parse and convert pace string (format: "X min/km")
  const formatPace = (paceString?: string): string | undefined => {
    if (!paceString) return undefined;
    
    // Extract number from string like "5 min/km" or "5.5 min/km"
    const match = paceString.match(/([\d.]+)/);
    if (!match) return paceString; // Return as-is if can't parse
    
    const minPerKm = parseFloat(match[1]);
    if (isNaN(minPerKm)) return paceString;
    
    const converted = convertPace(minPerKm);
    return `${converted.value.toFixed(2)} ${converted.unit}`;
  };
  
  // Fetch training load to get TSS if activity doesn't have it
  const { data: trainingLoadData } = useQuery({
    queryKey: ['trainingLoad', 60],
    queryFn: () => {
      console.log('[ActivityPopup] Fetching training load for 60 days');
      return fetchTrainingLoad(60);
    },
    retry: (failureCount, error) => {
      // Don't retry on timeout errors or 500 errors (fetchTrainingLoad returns empty response for 500s)
      if (error && typeof error === 'object') {
        const apiError = error as { code?: string; message?: string; status?: number };
        if (apiError.status === 500 || apiError.status === 503 ||
            apiError.code === 'ECONNABORTED' || 
            (apiError.message && apiError.message.includes('timed out'))) {
          return false;
        }
      }
      return failureCount < 1;
    },
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });
  
  // Enrich activity with TSS from training load if needed
  const enrichedActivity = useMemo(() => {
    if (!activity) return null;
    const enriched = enrichActivitiesWithTss([activity], trainingLoadData);
    return enriched[0] || activity;
  }, [activity, trainingLoadData]);
  
  // Get TSS for display
  const displayTss = enrichedActivity?.trainingLoad || 
    (activity?.date ? getTssForDate(activity.date, trainingLoadData) : null);

  // Generate lightweight structured workout preview (recognition, not duplication)
  const workoutPreview = useMemo(() => {
    if (!structuredWorkout?.steps || structuredWorkout.steps.length === 0) {
      return null;
    }

    const sortedSteps = [...structuredWorkout.steps].sort((a, b) => a.order - b.order);
    const groups = structuredWorkout.groups || [];
    
    // Build a map of step IDs to group info
    const stepToGroup: Map<string, { groupId: string; repeat: number; stepIds: string[] }> = new Map();
    for (const group of groups) {
      for (const stepId of group.step_ids) {
        stepToGroup.set(stepId, { groupId: group.group_id, repeat: group.repeat, stepIds: group.step_ids });
      }
    }
    
    // Generate compact summary with grouping support
    const summaryParts: string[] = [];
    const processedStepIds = new Set<string>();
    
    for (const step of sortedSteps) {
      if (processedStepIds.has(step.id)) continue;
      
      const group = stepToGroup.get(step.id);
      if (group) {
        // This step is part of a group
        const groupSteps = group.stepIds
          .map(id => sortedSteps.find(s => s.id === id))
          .filter((s): s is typeof step => s !== undefined)
          .sort((a, b) => a.order - b.order);
        
        if (groupSteps.length > 0) {
          const groupNames = groupSteps.map(s => s.name || s.step_type || 'Step');
          summaryParts.push(`${group.repeat}× (${groupNames.join(' + ')})`);
          groupSteps.forEach(s => processedStepIds.add(s.id));
        }
      } else {
        // Single step
        summaryParts.push(step.name || step.step_type || 'Step');
        processedStepIds.add(step.id);
      }
    }
    
    // Limit to ~6 items then add "+N"
    const maxItems = 6;
    let summary: string;
    if (summaryParts.length > maxItems) {
      summary = summaryParts.slice(0, maxItems).join(' → ') + ` +${summaryParts.length - maxItems}`;
    } else {
      summary = summaryParts.join(' → ');
    }

    return {
      summary,
      stepTypes: sortedSteps.map((step) => step.step_type || step.type),
      stepCount: sortedSteps.length,
    };
  }, [structuredWorkout]);

  const handleViewDetails = () => {
    onOpenChange(false);
    if (activity?.id) {
      navigate(`/history?activity=${activity.id}`);
    } else {
      navigate('/history');
    }
  };

  const handleViewWorkout = () => {
    if (session?.workout_id) {
      onOpenChange(false);
      navigate(`/workout/${session.workout_id}`);
    }
  };

  const handleLinkActivity = async () => {
    if (!session || !selectedActivityId) return;
    
    updateStatus.mutate(
      {
        sessionId: session.id,
        status: 'completed', // Ensure status is completed
        completedActivityId: selectedActivityId,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Activity linked',
            description: 'The activity has been linked to this session.',
          });
          setShowLinkActivity(false);
          setSelectedActivityId(null);
          onStatusChange?.();
        },
        onError: (error) => {
          console.error('Failed to link activity:', error);
          toast({
            title: 'Link failed',
            description: 'Failed to link the activity. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleStatusUpdate = (newStatus: 'completed' | 'skipped' | 'cancelled') => {
    if (!session || !isPlannedSession) return;
    
    updateStatus.mutate(
      {
        sessionId: session.id,
        status: newStatus,
      },
      {
        onSuccess: (response) => {
          // Check if response requires confirmation (PROPOSAL_ONLY)
          const proposal = checkForProposalResponse(response);
          
          if (proposal) {
            // Store pending confirmation
            setPendingConfirmation({ proposal, status: newStatus });
            return; // Don't close dialog, wait for confirmation
          }
          
          // Success - no confirmation needed (auto-adjusted/pre-authorized)
          toast({
            title: 'Session updated',
            description: `Auto-adjusted (pre-authorized)`,
          });
          
          onStatusChange?.();
          onOpenChange(false);
        },
        onError: (error) => {
          console.error('Failed to update session status:', error);
          toast({
            title: 'Update failed',
            description: 'Failed to update session status. Please try again.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleConfirmStatusUpdate = () => {
    if (!session || !pendingConfirmation) return;
    
    updateStatus.mutate(
      {
        sessionId: session.id,
        status: pendingConfirmation.status,
        confirmed: true, // confirmed flag
      },
      {
        onSuccess: (response) => {
          // Check if still PROPOSAL_ONLY (shouldn't happen but handle it)
          const proposal = checkForProposalResponse(response);
          if (proposal) {
            toast({
              title: 'Confirmation failed',
              description: 'Backend still returned PROPOSAL_ONLY even with confirmed=true',
              variant: 'destructive',
            });
            return;
          }
          
          // Success
          toast({
            title: 'Session updated',
            description: `Created after your confirmation`,
          });
          
          setPendingConfirmation(null);
          onStatusChange?.();
          onOpenChange(false);
        },
        onError: (error) => {
          console.error('Failed to confirm session status update:', error);
          toast({
            title: 'Confirmation failed',
            description: 'Failed to confirm session status update. Please try again.',
            variant: 'destructive',
          });
          // Keep dialog open for retry
        },
      }
    );
  };

  const handleCancelConfirmation = () => {
    setPendingConfirmation(null);
    toast({
      title: 'Cancelled',
      description: 'Session update was cancelled.',
      variant: 'default',
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <SportIcon className="h-5 w-5 text-foreground" />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-semibold text-foreground">
                  {workout?.title || activity?.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                  {workout && (
                    <Badge 
                      variant="outline" 
                      className={cn('text-xs', intentColors[workout.intent])}
                    >
                      {workout.intent}
                    </Badge>
                  )}
                  {activity && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                      Completed
                    </Badge>
                  )}
                  {workout?.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
          {/* Metrics row */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {workout?.duration || activity?.duration}m
            </span>
            {(workout?.distance || activity?.distance) && (
              <span className="flex items-center gap-1.5">
                <Route className="h-4 w-4" />
                {(() => {
                  const dist = convertDistance((workout?.distance || activity?.distance) || 0);
                  return `${dist.value.toFixed(1)} ${dist.unit}`;
                })()}
              </span>
            )}
            {activity?.elevation && (
              <span className="flex items-center gap-1.5">
                <Mountain className="h-4 w-4" />
                {(() => {
                  const elev = convertElevation(activity.elevation);
                  return `${elev.value.toFixed(1)} ${elev.unit}`;
                })()}
              </span>
            )}
          </div>

          {/* Activity-specific detailed view with tabs */}
          {activity && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full grid grid-cols-1 sm:grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
                <TabsTrigger value="charts">Charts</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="mt-4 space-y-4">
                {/* Coach Insight */}
                {activity.coachFeedback && (
                  <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary/40">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-medium text-primary">Analysis</span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">
                      {activity.coachFeedback}
                    </p>
                  </div>
                )}

                {/* Core Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activity.avgPace && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Avg Pace</div>
                      <div className="text-sm font-medium text-foreground">{formatPace(activity.avgPace)}</div>
                    </div>
                  )}
                  {activity.avgHeartRate && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Avg HR
                      </div>
                      <div className="text-sm font-medium text-foreground">{Math.round(activity.avgHeartRate)} bpm</div>
                    </div>
                  )}
                  {activity.avgPower && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Avg Power
                      </div>
                      <div className="text-sm font-medium text-foreground">{Math.round(activity.avgPower)}w</div>
                    </div>
                  )}
                  {displayTss !== null && displayTss > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">TSS</div>
                      <div className="text-sm font-medium text-foreground">{Math.round(displayTss)}</div>
                    </div>
                  )}
                  {/* Normalized Power / Effort - only for bike and run */}
                  {activity.normalizedPower !== undefined && activity.normalizedPower !== null && 
                   (activity.sport === 'cycling' || activity.sport === 'running') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="p-3 rounded-lg bg-muted/50 cursor-help">
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              {activity.sport === 'cycling' ? 'Normalized Power' : 'Normalized Effort'}
                              <Info className="h-3 w-3 text-muted-foreground/60" />
                            </div>
                            <div className="text-sm font-medium text-foreground">
                              {activity.sport === 'cycling' 
                                ? `${Math.round(activity.normalizedPower)} W`
                                : activity.normalizedPower.toFixed(2)}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="whitespace-pre-line text-sm">
                            {activity.sport === 'cycling' 
                              ? 'Normalized Power (NP)\nAccounts for variability in effort.\nMore accurate than average power.'
                              : 'Normalized Effort\nAdjusts for pace variability to reflect true effort.'}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {/* Intensity Factor - only for bike and run */}
                  {(activity.sport === 'cycling' || activity.sport === 'running') && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "p-3 rounded-lg bg-muted/50 cursor-help",
                            activity.effortSource === 'hr' && activity.intensityFactor !== undefined && "opacity-60",
                            activity.intensityFactor !== undefined && activity.intensityFactor >= 1.0 && "ring-2 ring-load-overreaching/30"
                          )}>
                            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Intensity Factor
                              <Info className="h-3 w-3 text-muted-foreground/60" />
                            </div>
                            <div className={cn(
                              "text-sm font-medium",
                              activity.intensityFactor !== undefined && activity.intensityFactor >= 1.0 
                                ? "text-load-overreaching" 
                                : "text-foreground"
                            )}>
                              {activity.intensityFactor !== undefined && activity.intensityFactor !== null
                                ? activity.intensityFactor.toFixed(2)
                                : '—'}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="whitespace-pre-line text-sm">
                            {activity.intensityFactor !== undefined && activity.intensityFactor !== null
                              ? 'Intensity Factor (IF)\nCompares session effort to your threshold.\nIF = 1.00 ≈ threshold effort\nIF < 0.75 = easy\nIF > 1.05 = hard'
                              : 'Set your threshold to enable IF'}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>

                {/* Effort Source Label */}
                {activity.effortSource && (
                  <div className="text-xs text-muted-foreground">
                    Effort source: {activity.effortSource === 'power' ? 'Power' : 
                                    activity.effortSource === 'pace' ? 'Pace-derived' : 
                                    'Heart rate (fallback)'}
                  </div>
                )}

                {/* Performance Metrics with Sparklines */}
                <div className="space-y-1 bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="text-xs font-medium text-muted-foreground mb-2">
                    Performance Trends
                  </div>
                  
                  {activity.avgHeartRate && (
                    <TelemetryMetricRow
                      label="HR"
                      value={Math.round(activity.avgHeartRate)}
                      unit="bpm"
                      sparkData={hrSparkData}
                      sparkColor="hsl(var(--chart-4))"
                    />
                  )}
                  
                  {paceSparkData && paceSparkData.length > 0 && (
                    <TelemetryMetricRow
                      label="Pace"
                      value={(() => {
                        const avgPace = paceSparkData.reduce((a, b) => a + b, 0) / paceSparkData.length;
                        const mins = Math.floor(avgPace);
                        const secs = Math.round((avgPace - mins) * 60);
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                      })()}
                      unit="/km"
                      sparkData={paceSparkData}
                      sparkColor="hsl(var(--chart-1))"
                    />
                  )}
                  
                  {elevSparkData && elevSparkData.length > 0 && (
                    <TelemetryMetricRow
                      label="Elev"
                      value={Math.round(Math.max(...elevSparkData) - Math.min(...elevSparkData))}
                      unit="m gain"
                      sparkData={elevSparkData}
                      sparkColor="hsl(var(--chart-2))"
                    />
                  )}

                  {activity.avgPower && (
                    <TelemetryMetricRow
                      label="Power"
                      value={Math.round(activity.avgPower)}
                      unit="W"
                    />
                  )}
                </div>
              </TabsContent>

              {/* MAP TAB */}
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

              {/* CHARTS TAB */}
              <TabsContent value="charts" className="mt-4">
                <ActivityCharts activity={activity} />
              </TabsContent>
            </Tabs>
          )}

          {/* Workout description */}
          {workout?.description && (
            <div className="text-sm text-muted-foreground">
              {workout.description}
            </div>
          )}

          {/* Structured workout preview (recognition, not duplication) */}
          {workoutPreview && session?.workout_id && (
            <div className="mt-3 rounded-md bg-muted/50 p-3 border border-border/50">
              <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
                Structured workout
              </div>
              <div className="text-sm font-medium text-foreground mb-2">
                {workoutPreview.summary}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap mb-2">
                {workoutPreview.stepTypes.map((stepType, idx) => {
                  const stepLabels: Record<string, string> = {
                    warmup: 'WU',
                    steady: 'Steady',
                    interval: 'Interval',
                    cooldown: 'CD',
                    rest: 'Rest',
                  };
                  const stepColors: Record<string, string> = {
                    warmup: 'bg-training-recovery/20 text-training-recovery border-training-recovery/30',
                    steady: 'bg-training-aerobic/20 text-training-aerobic border-training-aerobic/30',
                    interval: 'bg-training-vo2/20 text-training-vo2 border-training-vo2/30',
                    cooldown: 'bg-training-recovery/20 text-training-recovery border-training-recovery/30',
                    rest: 'bg-muted text-muted-foreground border-muted-foreground/30',
                  };
                  return (
                    <Badge
                      key={idx}
                      variant="outline"
                      className={cn('text-xs', stepColors[stepType] || 'bg-muted text-muted-foreground')}
                    >
                      {stepLabels[stepType] || stepType}
                    </Badge>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleViewWorkout}
                className="text-sm text-primary hover:text-primary/80 underline flex items-center gap-1 mt-1"
              >
                View full workout
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Legacy workout structure (keep for backward compatibility) */}
          {workout?.structure && workout.structure.length > 0 && !workoutPreview && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Structure
              </h4>
              <div className="space-y-1.5">
                {workout.structure.map((segment, idx) => (
                  <div 
                    key={idx}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md text-sm',
                      structureTypeColors[segment.type]
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="capitalize font-medium">{segment.type}</span>
                      {segment.notes && (
                        <span className="text-xs opacity-75">({segment.notes})</span>
                      )}
                    </div>
                    <div className="text-xs">
                      {segment.duration && `${segment.duration}m`}
                      {segment.intensity && ` • ${segment.intensity}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 flex-col">
            {isPlannedSession && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updateStatus.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Completed
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('skipped')}
                  disabled={updateStatus.isPending}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Skip
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatus.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
            {isCompletedWithoutActivity && (
              <div className="flex gap-2 flex-col">
                {!showLinkActivity ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowLinkActivity(true)}
                  >
                    <Link2 className="h-4 w-4 mr-2" />
                    Link Activity
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Select value={selectedActivityId || ''} onValueChange={setSelectedActivityId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an activity to link" />
                      </SelectTrigger>
                      <SelectContent>
                        {matchingActivities.length === 0 ? null : (
                          matchingActivities.map((act) => (
                            <SelectItem key={act.id} value={act.id}>
                              {act.title || 'Untitled'} - {act.duration ? `${Math.round(act.duration / 60)}min` : 'No duration'}
                              {act.distance ? ` - ${(act.distance).toFixed(1)}km` : ''}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="flex-1"
                        onClick={handleLinkActivity}
                        disabled={!selectedActivityId || updateStatus.isPending}
                      >
                        {updateStatus.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Linking...
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2" />
                            Link Activity
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowLinkActivity(false);
                          setSelectedActivityId(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              {session?.workout_id && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleViewWorkout}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Workout
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  onAskCoach?.(workout?.title || activity?.title || '');
                  onOpenChange(false);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Coach
              </Button>
              {canExport && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleExportFIT}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export FIT
                    </>
                  )}
                </Button>
              )}
              {activity && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleViewDetails}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>

    {pendingConfirmation && (
      <ConfirmationDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelConfirmation();
          }
        }}
        proposal={pendingConfirmation.proposal}
        onConfirm={handleConfirmStatusUpdate}
        onCancel={handleCancelConfirmation}
        isLoading={updateStatus.isPending}
      />
    )}
    </>
  );
}
