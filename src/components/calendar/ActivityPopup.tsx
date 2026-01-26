import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardTypography } from '@/styles/cardTypography';
import { WorkoutCardShell } from '@/components/sessions/WorkoutCardShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NarrativeBlock } from '@/components/workout/NarrativeBlock';
import { getIntentNarrative, getExecutionSummary, truncateNarrative } from '@/copy/workoutNarratives';
import { normalizeCalendarSport, normalizeCalendarIntent } from '@/types/calendar';
import { Footprints, Bike, Waves, Clock, Route, Mountain, Heart, Zap, MessageCircle, CheckCircle2, ExternalLink, X, SkipForward, TrendingUp, Info, Download, Loader2, ArrowRight, Link2, Bot, Trash2, Thermometer, Wind } from 'lucide-react';
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
import { getTodayIntelligence } from '@/lib/intelligence';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkoutDetailCard } from '@/components/workouts/WorkoutDetailCard';
import { EffortGraph } from '@/components/workout/EffortGraph';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
    status: 'completed' | 'skipped' | 'deleted';
  } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { convertDistance, convertElevation, convertPace, formatDistance } = useUnitSystem();
  const workout = plannedWorkout;
  const activity = completedActivity;
  const SportIcon = sportIcons[workout?.sport || activity?.sport || 'running'];
  const [isExporting, setIsExporting] = useState(false);
  const [showLinkActivity, setShowLinkActivity] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  
  // FE-3: Remove invalid filters - check if this is a session that can be updated
  const isPlannedSession = session && session.status !== 'completed' && session.status !== 'deleted' && session.status !== 'skipped' && !activity;
  
  // Check if session is completed but has no linked activity
  const isCompletedWithoutActivity = session && session.status === 'completed' && !session.completed_activity_id && !activity;

  // Fetch today's intelligence to determine recovery verdict
  const { data: todayIntelligence } = useAuthenticatedQuery({
    queryKey: ['todayIntelligence'],
    queryFn: () => getTodayIntelligence(),
    enabled: open && isPlannedSession,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if verdict suggests modification (REST, MODIFY, or CAUTION/CANCEL)
  const shouldShowRecoveryBanner = useMemo(() => {
    if (!todayIntelligence || !isPlannedSession) return false;
    
    // Check for v2 format
    if (typeof todayIntelligence === 'object' && 'version' in todayIntelligence) {
      const v2 = todayIntelligence as { version?: string; decision?: string };
      if (v2.version === 'coach_decision_v2') {
        const decision = v2.decision;
        return decision === 'REST' || decision === 'MODIFY' || decision === 'CANCEL';
      }
    }
    
    // Check for v1 format
    if (typeof todayIntelligence === 'object' && 'recommendation' in todayIntelligence) {
      const rec = (todayIntelligence as { recommendation?: string }).recommendation;
      if (rec) {
        const lower = rec.toLowerCase();
        return lower === 'rest' || lower.includes('modify') || lower.includes('cancel') || lower.includes('caution');
      }
    }
    
    return false;
  }, [todayIntelligence, isPlannedSession]);
  
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

  const cadenceSparkData = useMemo(() => {
    if (!streamsData?.cadence) return undefined;
    const cad = (streamsData.cadence as number[]).filter((v): v is number => typeof v === 'number' && v > 0);
    if (cad.length < 10) return undefined;
    const step = Math.max(1, Math.floor(cad.length / 30));
    return cad.filter((_, i) => i % step === 0);
  }, [streamsData]);

  const avgCadence = useMemo(() => {
    if (!cadenceSparkData || cadenceSparkData.length === 0) return undefined;
    const sum = cadenceSparkData.reduce((a, b) => a + b, 0);
    return Math.round(sum / cadenceSparkData.length);
  }, [cadenceSparkData]);

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

  // Convert structured workout steps to effort data for EffortGraph
  const effortDataFromWorkout = useMemo(() => {
    if (!structuredWorkout?.steps || structuredWorkout.steps.length === 0) {
      return null;
    }

    const sortedSteps = [...structuredWorkout.steps].sort((a, b) => a.order - b.order);
    const numBars = 10;
    const effortData: number[] = [];

    // Calculate total duration to distribute bars proportionally
    const totalDuration = sortedSteps.reduce((sum, step) => {
      return sum + (step.duration_seconds || 0);
    }, 0);

    if (totalDuration === 0) {
      // Fallback: equal distribution if no duration data
      return sortedSteps.map(() => {
        const stepType = (sortedSteps[0]?.step_type || sortedSteps[0]?.type || '').toLowerCase();
        if (stepType.includes('interval') || stepType.includes('vo2')) return 8;
        if (stepType.includes('tempo') || stepType.includes('threshold')) return 6;
        if (stepType.includes('warmup') || stepType.includes('cooldown') || stepType.includes('recovery')) return 3;
        return 5;
      }).slice(0, numBars);
    }

    // Map step type/intensity to effort value (0-10 scale)
    const getEffortValue = (step: typeof sortedSteps[0]): number => {
      const stepType = (step.step_type || step.type || '').toLowerCase();
      const intensity = (step.intensity || '').toLowerCase();

      // High intensity intervals
      if (stepType.includes('interval') || stepType.includes('vo2') || intensity.includes('vo2')) {
        return 8.5;
      }
      // Threshold/tempo efforts
      if (stepType.includes('tempo') || stepType.includes('threshold') || intensity.includes('threshold') || intensity.includes('tempo')) {
        return 6.5;
      }
      // Steady/aerobic
      if (stepType.includes('steady') || stepType.includes('aerobic') || intensity.includes('aerobic')) {
        return 5;
      }
      // Warmup/cooldown/recovery
      if (stepType.includes('warmup') || stepType.includes('cooldown') || stepType.includes('recovery') || stepType.includes('rest')) {
        return 3;
      }
      // Default moderate effort
      return 5;
    };

    // Distribute bars proportionally across workout duration
    let currentTime = 0;
    let stepIndex = 0;
    let stepStartTime = 0;
    let currentStep = sortedSteps[stepIndex];
    let currentStepDuration = currentStep?.duration_seconds || 0;

    for (let i = 0; i < numBars; i++) {
      const barTime = (i / numBars) * totalDuration;

      // Find which step this bar belongs to
      while (stepIndex < sortedSteps.length - 1 && barTime >= stepStartTime + currentStepDuration) {
        stepStartTime += currentStepDuration;
        stepIndex++;
        currentStep = sortedSteps[stepIndex];
        currentStepDuration = currentStep?.duration_seconds || 0;
      }

      if (currentStep) {
        effortData.push(getEffortValue(currentStep));
      } else {
        effortData.push(5); // Default if no step found
      }
    }

    return effortData;
  }, [structuredWorkout]);

  const handleViewDetails = () => {
    onOpenChange(false);
    if (activity?.id) {
      navigate(`/history?activity=${activity.id}`);
    } else {
      navigate('/history');
    }
  };

  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);

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

  const handleStatusUpdate = (newStatus: 'completed' | 'skipped' | 'deleted') => {
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
      <DialogContent className="p-0 sm:max-w-[600px] max-h-[85vh] overflow-y-auto bg-transparent border-0">
        <WorkoutCardShell role="modal" padding="p-0">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-muted">
                  <SportIcon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <DialogTitle 
                    className="mb-[6px] line-clamp-2"
                    style={CardTypography.title}
                  >
                    {workout?.title || activity?.title}
                  </DialogTitle>
                <div className="flex items-center gap-2 mb-[8px]">
                  {workout && (() => {
                    const intent = workout.intent?.toLowerCase() || '';
                    const isEasy = intent === 'easy' || intent === 'recovery' || intent === 'aerobic';
                    const isModerate = intent === 'threshold' || intent === 'tempo' || intent === 'endurance';
                    const isHard = intent === 'vo2' || intent === 'intervals';
                    
                    return (
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
                        {workout.intent.toUpperCase()}
                      </span>
                    );
                  })()}
                  {activity && (
                    <span
                      className="px-2 py-0.5 rounded-full inline-block"
                      style={{
                        ...CardTypography.metaChip,
                        backgroundColor: 'rgba(52,211,153,0.18)',
                        color: '#6EE7B7',
                      }}
                    >
                      COMPLETED
                    </span>
                  )}
                  {workout?.completed && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
          {/* Recovery Context Banner */}
          {shouldShowRecoveryBanner && (
            <Alert className="bg-amber-500/10 border-amber-500/30 mb-[10px]">
              <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-foreground">
                <span className="font-semibold">Recovery Suggestion</span>
                <br />
                Today is flagged as a low-readiness day. Consider modifying or skipping this session.
              </AlertDescription>
            </Alert>
          )}

          {/* Metrics row */}
          <div className="flex items-center gap-4 mb-[10px]" style={CardTypography.stat}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 opacity-60" />
              {workout?.duration || activity?.duration}m
            </span>
            {(workout?.distance || activity?.distance) && (
              <span className="flex items-center gap-1">
                <Route className="w-3 h-3 opacity-60" />
                {(() => {
                  const dist = convertDistance((workout?.distance || activity?.distance) || 0);
                  return `${dist.value.toFixed(1)} ${dist.unit}`;
                })()}
              </span>
            )}
            {activity?.elevation && (
              <span className="flex items-center gap-1">
                <Mountain className="w-3 h-3 opacity-60" />
                {(() => {
                  const elev = convertElevation(activity.elevation);
                  return `${elev.value.toFixed(1)} ${elev.unit}`;
                })()}
              </span>
            )}
          </div>

          {/* ============ NARRATIVE BLOCK ============ */}
          {(() => {
            // Determine status
            const isCompleted = !!activity || workout?.completed;
            const status = isCompleted ? 'completed' : 'planned';
            
            // Derive intent text
            const sport = normalizeCalendarSport(workout?.sport || activity?.sport);
            const intent = normalizeCalendarIntent(workout?.intent || session?.intensity);
            const intentText = intent ? truncateNarrative(getIntentNarrative(sport, intent, isCompleted)) : undefined;
            
            // Derive execution summary (only for completed)
            // This should be factual - how the session went
            let executionSummary: string | undefined = undefined;
            if (isCompleted && activity) {
              // Use a simple completion message for now
              // Could be enhanced with compliance data later
              executionSummary = 'Completed as planned.';
            }
            
            // Get coach insight - check multiple sources
            // Priority: activity.coachFeedback > session.coach_insight
            // Coach insight can appear for both planned and completed sessions
            const coachInsight = (() => {
              if (activity?.coachFeedback) {
                return {
                  text: activity.coachFeedback,
                  tone: 'neutral' as const,
                };
              }
              if (session?.coach_insight) {
                return {
                  text: session.coach_insight,
                  tone: 'neutral' as const,
                };
              }
              return undefined;
            })();
            
            // Check if unplanned
            const isUnplanned = isCompleted && !session?.completed_activity_id && !workout?.actualActivityId;
            
            // Extract LLM feedback from execution_state if available
            const llmFeedback = session?.execution_state?.llm_feedback || null;

            return (
              <div className="pb-4">
                <NarrativeBlock
                  intentText={intentText}
                  executionSummary={executionSummary}
                  coachInsight={coachInsight}
                  llmFeedback={llmFeedback}
                  status={status}
                  isUnplanned={isUnplanned}
                />
              </div>
            );
          })()}

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
                {/* Coach Insight removed - now shown in NarrativeBlock above tabs */}

                {/* Core Metrics Grid: overview (distance, time, TSS, elevation) + execution (HR, cadence, pace) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Route className="h-3 w-3" /> Distance
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {convertDistance(activity.distance).value.toFixed(1)} {convertDistance(activity.distance).unit}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Time
                    </div>
                    <div className="text-sm font-medium text-foreground">{activity.duration} min</div>
                  </div>
                  {displayTss !== null && displayTss > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">TSS</div>
                      <div className="text-sm font-medium text-foreground">{Math.round(displayTss)}</div>
                    </div>
                  )}
                  {activity.elevation != null && activity.elevation > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Mountain className="h-3 w-3" /> Elevation
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {Math.round(convertElevation(activity.elevation).value)} {convertElevation(activity.elevation).unit}
                      </div>
                    </div>
                  )}
                  {(activity.avgPace || paceSparkData) && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Avg Pace</div>
                      <div className="text-sm font-medium text-foreground">
                        {activity.avgPace
                          ? (formatPace(activity.avgPace) ?? activity.avgPace)
                          : paceSparkData
                            ? (() => {
                                const avgPace = paceSparkData.reduce((a, b) => a + b, 0) / paceSparkData.length;
                                const mins = Math.floor(avgPace);
                                const secs = Math.round((avgPace - mins) * 60);
                                return `${mins}:${secs.toString().padStart(2, '0')} /km`;
                              })()
                            : '—'}
                      </div>
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
                  {avgCadence != null && avgCadence > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">Cadence</div>
                      <div className="text-sm font-medium text-foreground">{avgCadence} rpm</div>
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
                  
                  {(paceSparkData?.length ? paceSparkData : activity.avgPace) && (
                    <TelemetryMetricRow
                      label="Pace"
                      value={
                        paceSparkData?.length
                          ? (() => {
                              const avgPace = paceSparkData.reduce((a, b) => a + b, 0) / paceSparkData.length;
                              const mins = Math.floor(avgPace);
                              const secs = Math.round((avgPace - mins) * 60);
                              return `${mins}:${secs.toString().padStart(2, '0')}`;
                            })()
                          : (activity.avgPace ?? '—')
                      }
                      unit="/km"
                      sparkData={paceSparkData}
                      sparkColor="hsl(var(--chart-1))"
                    />
                  )}
                  {avgCadence != null && avgCadence > 0 && (
                    <TelemetryMetricRow
                      label="Cadence"
                      value={avgCadence}
                      unit="rpm"
                      sparkData={cadenceSparkData}
                      sparkColor="hsl(var(--chart-3))"
                    />
                  )}
                  {activity?.elevation && activity.elevation > 0 && (
                    <TelemetryMetricRow
                      label="Elev"
                      value={(() => {
                        const elev = convertElevation(activity.elevation);
                        return Math.round(elev.value);
                      })()}
                      unit={(() => {
                        const elev = convertElevation(activity.elevation);
                        return elev.unit;
                      })()}
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

                {/* Climate Data Section */}
                {(() => {
                  // Check if any climate data exists (not undefined and not null)
                  const hasHeatStress = activity.heatStressIndex !== undefined && activity.heatStressIndex !== null;
                  const hasEffectiveHeatStress = activity.effectiveHeatStressIndex !== undefined && activity.effectiveHeatStressIndex !== null;
                  const hasColdStress = activity.coldStressIndex !== undefined && activity.coldStressIndex !== null;
                  const hasConditionsLabel = activity.conditionsLabel !== undefined && activity.conditionsLabel !== null && activity.conditionsLabel !== '';
                  const hasClimateData = hasHeatStress || hasEffectiveHeatStress || hasColdStress || hasConditionsLabel;
                  
                  console.log('[ActivityPopup] Climate data check:', {
                    hasHeatStress,
                    hasEffectiveHeatStress,
                    hasColdStress,
                    hasConditionsLabel,
                    hasClimateData,
                    rawValues: {
                      heatStressIndex: activity.heatStressIndex,
                      effectiveHeatStressIndex: activity.effectiveHeatStressIndex,
                      heatAcclimationScore: activity.heatAcclimationScore,
                      coldStressIndex: activity.coldStressIndex,
                      windChillC: activity.windChillC,
                      avgTemperatureC: activity.avgTemperatureC,
                      conditionsLabel: activity.conditionsLabel,
                    },
                    allActivityKeys: Object.keys(activity),
                  });
                  
                  return hasClimateData;
                })() && (
                  <div className="space-y-1 bg-muted/30 rounded-lg p-3 border border-border">
                    <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Climate Conditions
                    </div>
                    
                    {activity.conditionsLabel && (
                      <TelemetryMetricRow
                        label="Conditions"
                        value={activity.conditionsLabel}
                      />
                    )}

                    {activity.effectiveHeatStressIndex !== undefined && activity.effectiveHeatStressIndex !== null ? (
                      <TelemetryMetricRow
                        label="Heat Stress"
                        value={`${(activity.effectiveHeatStressIndex * 100).toFixed(0)}%${
                          activity.heatAcclimationScore !== undefined && activity.heatAcclimationScore !== null && activity.heatAcclimationScore > 0 
                            ? ` (${(activity.heatAcclimationScore * 100).toFixed(0)}% acclimated)` 
                            : ''
                        }`}
                      />
                    ) : activity.heatStressIndex !== undefined && activity.heatStressIndex !== null ? (
                      <TelemetryMetricRow
                        label="Heat Stress"
                        value={`${(activity.heatStressIndex * 100).toFixed(0)}%`}
                      />
                    ) : null}

                    {activity.coldStressIndex !== undefined && activity.coldStressIndex !== null && (
                      <TelemetryMetricRow
                        label="Cold Stress"
                        value={`${(activity.coldStressIndex * 100).toFixed(0)}%`}
                      />
                    )}

                    {activity.avgTemperatureC !== undefined && activity.avgTemperatureC !== null && (
                      <TelemetryMetricRow
                        label="Temperature"
                        value={`${activity.avgTemperatureC.toFixed(1)}°C`}
                      />
                    )}

                    {activity.windAvgMps !== undefined && activity.windAvgMps !== null && (
                      <TelemetryMetricRow
                        label="Wind Speed"
                        value={`${(activity.windAvgMps * 3.6).toFixed(1)} km/h`}
                      />
                    )}

                    {activity.windChillC !== undefined && activity.windChillC !== null && (
                      <TelemetryMetricRow
                        label="Wind Chill"
                        value={`${activity.windChillC.toFixed(1)}°C`}
                      />
                    )}
                  </div>
                )}
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

          {/* Structured workout effort graph */}
          {effortDataFromWorkout && session?.workout_id && (
            <div className="mt-3 rounded-md bg-muted/50 p-3 border border-border/50">
              <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                Structured workout
              </div>
              <div className="h-16">
                <EffortGraph
                  data={effortDataFromWorkout}
                  showData={true}
                  compact={false}
                />
              </div>
            </div>
          )}

          {/* Legacy workout structure (keep for backward compatibility) */}
          {workout?.structure && workout.structure.length > 0 && !effortDataFromWorkout && (
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

          {/* Expandable Workout Details - only show for planned sessions without activity */}
          {/* For completed sessions with activity, show activity tabs above instead */}
          {session && isPlannedSession && !activity && (
            <div className="mt-4">
              <WorkoutDetailCard
                session={session}
                expanded={showWorkoutDetails}
                onToggleExpand={() => setShowWorkoutDetails(!showWorkoutDetails)}
                onStatusChange={onStatusChange}
              />
            </div>
          )}

          {/* Action buttons - Note: WorkoutDetailCard includes action buttons for planned sessions */}
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
                    <Button
                      variant="default"
                      className="w-full"
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
                      className="w-full"
                      onClick={() => {
                        setShowLinkActivity(false);
                        setSelectedActivityId(null);
                      }}
                    >
                      Back
                    </Button>
                  </div>
                )}
              </div>
            )}
            {/* Workout expansion is now handled inline by WorkoutDetailCard */}
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1 bg-white/10 hover:bg-white/15 border-white/15 text-white"
                onClick={() => {
                  if (isPlannedSession && session?.id) {
                    // Navigate to coach with pre-filled draft message for modification
                    const draftMessage = "Today was marked as a REST day based on my recovery signals.\nCan you modify today's planned session accordingly (e.g., reduce volume, replace with recovery, or skip)?";
                    navigate('/coach', {
                      state: {
                        context: 'modify_today_session',
                        session_id: session.id,
                        suggested_action: 'generic',
                        draft_message: draftMessage,
                      },
                    });
                  } else {
                    // Fallback for non-planned sessions
                    onAskCoach?.(workout?.title || activity?.title || '');
                  }
                  onOpenChange(false);
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Ask Coach to Modify
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
                  className="flex-1 rounded-[10px]"
                  onClick={handleViewDetails}
                  style={{
                    background: 'linear-gradient(180deg, rgba(59,130,246,0.28), rgba(30,64,175,0.32))',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 18px rgba(59,130,246,0.35)',
                    border: 'none',
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        </WorkoutCardShell>
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

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Session</AlertDialogTitle>
          <AlertDialogDescription>
            Delete this planned session? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateStatus.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => handleStatusUpdate('deleted')}
            disabled={updateStatus.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {updateStatus.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
