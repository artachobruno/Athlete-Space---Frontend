import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Footprints, Bike, Waves, Clock, Route, Mountain, Heart, Zap, MessageCircle, CheckCircle2, ExternalLink, X, SkipForward, TrendingUp, Info, Download, Loader2, ArrowRight } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchTrainingLoad, type CalendarSession, type ProposalOnlyResponse, exportWorkoutToFIT } from '@/lib/api';
import { fetchStructuredWorkout } from '@/api/workouts';
import { useMemo, useState } from 'react';
import { getTssForDate, enrichActivitiesWithTss } from '@/lib/tss-utils';
import { toast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/confirmation/ConfirmationDialog';
import { checkForProposalResponse } from '@/lib/confirmation-handler';
import { useUpdateSessionStatus } from '@/hooks/useCalendarMutations';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

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
  
  // FE-3: Remove invalid filters - check if this is a session that can be updated
  const isPlannedSession = session && session.status !== 'completed' && session.status !== 'cancelled' && session.status !== 'skipped' && !activity;

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
    
    // Generate step type chips (categorical only, no details)
    const stepTypes = sortedSteps.map((step) => {
      const typeLabels: Record<string, string> = {
        warmup: 'WU',
        steady: 'Steady',
        interval: 'Interval',
        cooldown: 'CD',
        rest: 'Rest',
      };
      return typeLabels[step.step_type] || step.step_type;
    });

    // Generate compact summary (1-2 lines max)
    const summary = stepTypes.join(' → ');

    return {
      summary,
      stepTypes: sortedSteps.map((step) => step.step_type),
      stepCount: sortedSteps.length,
    };
  }, [structuredWorkout]);

  const handleViewDetails = () => {
    onOpenChange(false);
    if (activity?.id) {
      navigate(`/activities?activity=${activity.id}`);
    } else {
      navigate('/activities');
    }
  };

  const handleViewWorkout = () => {
    if (session?.workout_id) {
      onOpenChange(false);
      navigate(`/workout/${session.workout_id}`);
    }
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

  // PHASE F1: Remove defensive checks - assume workout or activity always exists
  // If this breaks, it's a backend bug

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <SportIcon className="h-5 w-5 text-foreground" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg font-semibold text-foreground">
                {workout?.title || activity?.title}
              </DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                {workout && (
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', intentColors[workout.intent])}
                  >
                    {workout.intent}
                  </Badge>
                )}
                {activity && (
                  <Badge variant="outline" className="text-xs bg-accent/15 text-accent border-accent/30">
                    Completed
                  </Badge>
                )}
                {workout?.completed && (
                  <CheckCircle2 className="h-4 w-4 text-load-fresh" />
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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

          {/* Activity-specific metrics */}
          {activity && (
            <div className="grid grid-cols-2 gap-3">
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
              {/* Effort Source Label */}
              {activity.effortSource && (
                <div className="col-span-2 text-xs text-muted-foreground">
                  Effort source: {activity.effortSource === 'power' ? 'Power' : 
                                  activity.effortSource === 'pace' ? 'Pace-derived' : 
                                  'Heart rate (fallback)'}
                </div>
              )}
            </div>
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

          {/* Coach feedback for completed activities */}
          {activity?.coachFeedback && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-accent">Coach Feedback</span>
              </div>
              <p className="text-sm text-foreground">{activity.coachFeedback}</p>
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
        </div>
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
