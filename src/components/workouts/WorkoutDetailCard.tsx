/**
 * Phase 2: Canonical Workout Detail Card
 * 
 * Single source of truth for displaying full workout detail.
 * Used consistently across Today and Schedule views.
 * Expands/collapses inline - no route navigation.
 */

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, SkipForward, Trash2, ChevronDown, ChevronUp, ArrowRight, ExternalLink, Brain, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout';
import { WorkoutHeader } from '@/components/workout/WorkoutHeader';
import { WorkoutStepsTable } from '@/components/workout/WorkoutStepsTable';
import { WorkoutTimeline } from '@/components/workout/WorkoutTimeline';
import { WorkoutComparison } from '@/components/workout/WorkoutComparison';
import { ParseStatusBanner } from '@/components/workout/ParseStatusBanner';
import { useUpdateSessionStatus } from '@/hooks/useCalendarMutations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
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
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { cn } from '@/lib/utils';
import type { CalendarSession } from '@/lib/api';

interface WorkoutDetailCardProps {
  session: CalendarSession;
  expanded: boolean;
  onToggleExpand: () => void;
  /** Optional callback when session status changes */
  onStatusChange?: () => void;
  /** Show link to full workout page (default: true) */
  showFullWorkoutLink?: boolean;
  /** Additional CSS classes */
  className?: string;
}

const intentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
};

export function WorkoutDetailCard({
  session,
  expanded,
  onToggleExpand,
  onStatusChange,
  showFullWorkoutLink = true,
  className,
}: WorkoutDetailCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateStatus = useUpdateSessionStatus();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { formatDistance, convertDistance } = useUnitSystem();

  // Fetch structured workout data if workout_id exists
  const workoutState = useStructuredWorkout(session.workout_id || undefined);

  const handleStatusUpdate = async (status: 'completed' | 'skipped' | 'deleted') => {
    updateStatus.mutate(
      {
        sessionId: session.id,
        status,
      },
      {
        onSuccess: () => {
          // Invalidate calendar queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['calendarWeek'] });
          queryClient.invalidateQueries({ queryKey: ['calendarSeason'] });
          queryClient.invalidateQueries({ queryKey: ['calendarToday'] });

          toast({
            title: 'Session updated',
            description: status === 'deleted' ? 'Session deleted.' : `Session marked as ${status}.`,
          });

          onStatusChange?.();
          setShowDeleteDialog(false);
        },
        onError: (error) => {
          const apiError = error as { message?: string };
          const errorMessage = apiError.message || 'Failed to update session status. Please try again.';

          toast({
            title: 'Update failed',
            description: errorMessage,
            variant: 'destructive',
          });
        },
      }
    );
  };

  // Only show action buttons for planned sessions
  const showActions = session.status === 'planned';

  // Format duration
  const formatDuration = (minutes: number | null): string => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Get intensity/intent for badge
  const intensity = session.intensity || session.type || null;
  const intent = intensity?.toLowerCase() || null;
  const intentColorClass = intent && intent in intentColors 
    ? intentColors[intent as keyof typeof intentColors]
    : 'bg-muted text-muted-foreground border-border';

  // Phase 5A: Coach verdict check
  const hasCoachVerdict = session.coach_verdict && session.coach_verdict.type !== 'ok';
  const coachVerdict = session.coach_verdict;

  // Phase 5A: Only allow coach modification for today or future sessions
  // Parse date string (format: YYYY-MM-DD) and compare properly
  const sessionDateStr = session.date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let isTodayOrFuture = false;
  if (sessionDateStr) {
    // Parse date string (YYYY-MM-DD format)
    const [year, month, day] = sessionDateStr.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day);
    sessionDate.setHours(0, 0, 0, 0);
    // Compare dates (not time)
    isTodayOrFuture = sessionDate.getTime() >= today.getTime();
  }

  /**
   * Phase 5A: Generate draft message based on coach verdict
   */
  const generateDraftMessage = (verdictType: string): string => {
    const baseMessage = "Today's workout was flagged based on recovery signals.\n\n";
    
    switch (verdictType) {
      case 'rest':
        return `${baseMessage}Can we adjust today's session?\nOptions I'm considering:\n- Skip today\n- Convert to recovery\n- Light movement only\n\nHappy to follow your guidance.`;
      case 'modify':
        return `${baseMessage}Can we adjust today's session?\nOptions I'm considering:\n- Reduce volume\n- Convert to recovery\n- Skip\n\nHappy to follow your guidance.`;
      case 'caution':
        return `${baseMessage}This session may need adjustment based on my recovery signals.\n\nCan we discuss the best approach for today?\n\nHappy to follow your guidance.`;
      default:
        return `${baseMessage}Can we adjust today's session?\nOptions I'm considering:\n- Reduce volume\n- Convert to recovery\n- Skip\n\nHappy to follow your guidance.`;
    }
  };

  /**
   * Phase 5A: Navigate to coach with draft message
   */
  const handleAskCoachToModify = () => {
    const draftMessage = coachVerdict 
      ? generateDraftMessage(coachVerdict.type)
      : generateDraftMessage('modify');
    
    navigate('/coach', {
      state: {
        context: 'modify_today_session',
        session_id: session.id,
        suggested_action: coachVerdict?.type === 'rest' ? 'skip' : 'generic',
        draft_message: draftMessage,
      },
    });
  };

  const handleDiscussWithCoach = () => {
    navigate('/coach', {
      state: {
        context: 'modify_today_session',
        session_id: session.id,
        suggested_action: 'generic',
        draft_message: coachVerdict?.reason 
          ? `I saw your suggestion about today's session: "${coachVerdict.reason}"\n\nCan we discuss this further?`
          : "I'd like to discuss today's session with you.",
      },
    });
  };

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              {/* Title */}
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{session.title || session.type || 'Workout'}</h3>
                {intent && (
                  <Badge variant="outline" className={cn('text-xs', intentColorClass)}>
                    {intent}
                  </Badge>
                )}
              </div>

              {/* Metrics */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {session.duration_minutes && (
                  <span>Duration: {formatDuration(session.duration_minutes)}</span>
                )}
                {session.distance_km && (
                  <span>
                    Distance: {formatDistance(convertDistance(session.distance_km))}
                  </span>
                )}
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Full Workout Link - only show when expanded and workout_id exists */}
              {expanded && showFullWorkoutLink && session.workout_id && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent click handlers
                    navigate(`/workout/${session.workout_id}`);
                  }}
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View full workout
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              )}
              
              {/* Expand/Collapse button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Expand
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6 pt-0">
            {/* Phase 5A: Coach Verdict Insight (only when verdict !== "ok") */}
            {hasCoachVerdict && coachVerdict && (
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="text-sm font-semibold text-foreground">Coach Suggestion</h4>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <p className="text-sm text-foreground leading-relaxed">
                    {coachVerdict.reason}
                  </p>
                  
                  {/* Phase 5A: Action Buttons - only for today or future sessions */}
                  {isTodayOrFuture && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleAskCoachToModify}
                        className="flex-1"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Ask Coach to Modify Today's Session
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDiscussWithCoach}
                        className="flex-1"
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Discuss with Coach
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Coach Insight (legacy - general insight, not verdict-based) */}
            {session.coach_insight && !hasCoachVerdict && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="text-sm font-semibold mb-2">Coach Insight</h4>
                <p className="text-sm text-muted-foreground">{session.coach_insight}</p>
              </div>
            )}

            {/* Structured Workout Details */}
            {session.workout_id && (
              <>
                {workoutState.status === 'loading' && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}

                {workoutState.status === 'error' && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Unable to load workout details</p>
                    <p className="text-xs mt-1">{workoutState.error}</p>
                  </div>
                )}

                {workoutState.status === 'ready' && (
                  <>
                    {!workoutState.data.structured_available && workoutState.data.steps.length === 0 && (
                      <ParseStatusBanner parseStatus={workoutState.data.workout.parse_status} />
                    )}

                    {workoutState.data.structured_available && workoutState.data.steps.length > 0 && (
                      <>
                        <Card>
                          <CardContent className="pt-6">
                            <WorkoutTimeline
                              steps={workoutState.data.steps}
                              totalDistanceMeters={workoutState.data.workout.total_distance_meters}
                              totalDurationSeconds={workoutState.data.workout.total_duration_seconds}
                            />
                          </CardContent>
                        </Card>

                        {workoutState.data.comparison && workoutState.data.comparison.length > 0 && (
                          <Card>
                            <CardContent className="pt-6">
                              <WorkoutComparison
                                steps={workoutState.data.steps}
                                comparison={workoutState.data.comparison}
                                totalDistanceMeters={workoutState.data.workout.total_distance_meters}
                                totalDurationSeconds={workoutState.data.workout.total_duration_seconds}
                              />
                            </CardContent>
                          </Card>
                        )}

                        <Card>
                          <CardContent className="pt-6">
                            <WorkoutStepsTable
                              steps={workoutState.data.steps}
                              groups={workoutState.data.groups}
                            />
                          </CardContent>
                        </Card>
                      </>
                    )}

                    {!workoutState.data.structured_available && workoutState.data.steps.length === 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No structured steps available</p>
                            {workoutState.data.workout.parse_status === 'pending' && (
                              <p className="text-xs mt-2">Steps are being generated...</p>
                            )}
                            {workoutState.data.workout.parse_status === 'failed' && (
                              <p className="text-xs mt-2">Unable to parse workout steps</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </>
            )}

            {/* Session Instructions (from CalendarSession.steps) */}
            {session.steps && session.steps.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold mb-4">Workout Steps</h4>
                  <div className="space-y-2">
                    {session.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                          {step.order || idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">{step.name || `Step ${idx + 1}`}</span>
                            {step.intensity && (
                              <Badge variant="outline" className="text-xs">
                                {step.intensity}
                              </Badge>
                            )}
                          </div>
                          {step.duration_min && (
                            <p className="text-xs text-muted-foreground">Duration: {step.duration_min} min</p>
                          )}
                          {step.distance_km && (
                            <p className="text-xs text-muted-foreground">
                              Distance: {formatDistance(convertDistance(step.distance_km))}
                            </p>
                          )}
                          {step.intensity && (
                            <p className="text-xs text-muted-foreground">Intensity: {step.intensity}</p>
                          )}
                          {step.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{step.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Must-dos */}
            {session.must_dos && session.must_dos.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold mb-3">Must-Dos</h4>
                  <ul className="space-y-2">
                    {session.must_dos.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Execution Notes */}
            {session.execution_notes && (
              <Card>
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold mb-2">Execution Notes</h4>
                  <p className="text-sm text-muted-foreground">{session.execution_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Phase 1 Action Buttons */}
            {showActions && (
              <div className="flex gap-2 pt-4 border-t">
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
                  className="flex-1 text-destructive hover:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={updateStatus.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      {showActions && (
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
      )}
    </>
  );
}
