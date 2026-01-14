import { useMemo, useState } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  parseISO,
  isPast,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { type CalendarSession } from '@/lib/api';
import { useUpdatePlannedSession, useUpdateWorkoutDate } from '@/hooks/useCalendarMutations';
import { mapSessionToWorkout, normalizeSportType } from '@/lib/session-utils';
import { fetchCalendarMonth, normalizeCalendarMonth, type DayCalendarData } from '@/lib/calendar-month';
import { Footprints, Bike, Waves, CheckCircle2, MessageCircle, Loader2, AlertTriangle, CheckCircle, Link2, MoreVertical, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggablePlannedSession } from './DraggablePlannedSession';
import { DroppableDayCell } from './DroppableDayCell';
import { PairingDetailsModal } from './PairingDetailsModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { useDeleteActivity, useDeletePlannedSession } from '@/hooks/useDeleteMutations';
import { markDragOperationComplete } from '@/hooks/useAutoMatchSessions';
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

interface MonthViewProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: import('@/lib/api').CalendarSession | null) => void;
}

const sportIcons = {
  running: Footprints,
  cycling: Bike,
  swimming: Waves,
  triathlon: Footprints,
} as const;

/**
 * Gets the icon component for a sport type, with fallback to default icon.
 */
function getSportIcon(sport: string | null | undefined): typeof Footprints {
  const normalized = normalizeSportType(sport);
  const Icon = sportIcons[normalized];
  return Icon || Footprints; // Fallback to Footprints if somehow undefined
}

/**
 * MonthView Component
 * 
 * Displays both CalendarSession objects (planned and completed sessions) and
 * activities from the /activities endpoint. Activities are fetched and displayed
 * alongside sessions to provide a complete view of training activities.
 */
export function MonthView({ currentDate, onActivityClick }: MonthViewProps) {
  const queryClient = useQueryClient();
  const updateSession = useUpdatePlannedSession();
  const updateWorkout = useUpdateWorkoutDate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedSession, setDraggedSession] = useState<CalendarSession | null>(null);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [selectedPairingActivity, setSelectedPairingActivity] = useState<CompletedActivity | null>(null);
  const [selectedPairingSession, setSelectedPairingSession] = useState<CalendarSession | null>(null);
  const deleteActivityMutation = useDeleteActivity();
  const deletePlannedSessionMutation = useDeletePlannedSession();
  const [deleteActivityDialog, setDeleteActivityDialog] = useState<{ open: boolean; activity: CompletedActivity | null }>({ open: false, activity: null });
  const [deleteSessionDialog, setDeleteSessionDialog] = useState<{ open: boolean; session: CalendarSession | null }>({ open: false, session: null });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');
  
  // Fetch month data (includes planned sessions, completed activities, and workouts)
  // CRITICAL: Use useAuthenticatedQuery to gate behind auth and prevent race conditions
  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  // Normalize month data by day
  const dayDataMap = useMemo(() => {
    if (!monthData) return new Map<string, DayCalendarData>();
    
    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, DayCalendarData>();
    for (const day of normalizedDays) {
      map.set(day.date, day);
    }
    return map;
  }, [monthData]);
  
  // Collect all sessions for drag-and-drop
  const allSessions = useMemo(() => {
    if (!monthData) return [];
    return [...monthData.planned_sessions, ...monthData.workouts];
  }, [monthData]);
  
  // Debug logging
  if (monthData) {
    const totalSessions = allSessions.length;
    const plannedCount = monthData.planned_sessions.length;
    const completedCount = monthData.completed_activities.length;
    const workoutsCount = monthData.workouts.length;
    console.log('[MonthView] Month data loaded:', {
      month: format(currentDate, 'MMMM yyyy'),
      plannedSessions: plannedCount,
      completedActivities: completedCount,
      workouts: workoutsCount,
      totalSessions,
    });
  }

  const days = useMemo(() => {
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate, monthStart, monthEnd]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = dayDataMap.get(dateStr);
    
    if (!dayData) {
      return { planned: [], completed: [], plannedSessions: [], completedSessions: [] };
    }
    
    // Map planned sessions to workouts
    const planned = dayData.plannedSessions
      .map(mapSessionToWorkout)
      .filter((w): w is PlannedWorkout => w !== null && w.sport !== undefined);
    
    // Completed activities MUST ONLY come from /activities endpoint
    // Never synthesize them from workouts - workouts are containers, not executions
    // The rendering code will do lookup-only pairing when displaying workouts
    const completed = dayData.completedActivities;
    
    return {
      planned,
      completed,
      plannedSessions: dayData.plannedSessions,
      completedSessions: dayData.workouts,
    };
  };

  // Get all planned session IDs for SortableContext
  const allPlannedSessionIds = useMemo(() => {
    if (!monthData) return [];
    return monthData.planned_sessions.map(s => s.id);
  }, [monthData]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (!activeData?.session) return;
    
    const session = activeData.session as CalendarSession;
    
    // CRITICAL: Block drag if planned_session_id is missing
    // Drag only allowed when planned_session_id exists
    if (!session.planned_session_id) {
      console.warn('[MonthView] Blocked drag: missing planned_session_id', session);
      return;
    }
    
    setActiveId(event.active.id as string);
    setDraggedSession(session);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedSession(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle drops on day cells
    if (overData?.type !== 'day' || !activeData?.session) return;

    const session = activeData.session as CalendarSession;
    const newDate = overData.date as string;
    const oldDate = session.date ? format(new Date(session.date), 'yyyy-MM-dd') : '';

    // Don't update if dropped on the same day
    if (newDate === oldDate) return;

    // Check if dragging a past/completed session
    const sessionDate = session.date ? parseISO(session.date) : null;
    const isPastSession = sessionDate && isPast(sessionDate) && !isToday(sessionDate);
    const hasCompletedActivity = activeData.matchingActivity !== null && activeData.matchingActivity !== undefined;

    // Show warning for past sessions or completed workouts
    if (isPastSession || hasCompletedActivity) {
      const warningMessage = hasCompletedActivity
        ? 'You moved a completed workout. Completion was preserved.'
        : 'You moved a past session.';
      
      toast({
        title: 'Session moved',
        description: warningMessage,
        variant: 'default',
      });
    }

    // CRITICAL: Only planned_sessions.id may be mutated.
    // Calendar sessions, workouts, and activities are READ-ONLY views.
    // GUARD: Block move if planned_session_id is missing
    const plannedSessionId = session.planned_session_id;
    
    if (!plannedSessionId) {
      console.warn('[MonthView] Blocked move: missing planned_session_id', session);
      toast({
        title: 'Move failed',
        description: 'Cannot move session: missing planned session ID. Unpair activity to move this session.',
        variant: 'destructive',
      });
      return;
    }

    // PHASE F5: Prefer workout endpoint if workout_id exists
    if (session.workout_id) {
      updateWorkout.mutate(
        {
          workoutId: session.workout_id,
          scheduledDate: newDate,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Workout moved',
              description: `Moved to ${format(parseISO(newDate), 'MMM d, yyyy')}`,
            });
            // CRITICAL: Mark drag operation complete to prevent useAutoMatchSessions from interfering
            markDragOperationComplete();
            // PHASE F4: Invalidate aggressively - backend handles reorder
            queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['calendarWeek'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['calendarSeason'], exact: false });
          },
          onError: (error) => {
            console.error('Failed to move workout:', error);
            toast({
              title: 'Move failed',
              description: 'Failed to move workout. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    } else {
      // Use planned_session_id for mutation (NOT session.id - that's a calendar view ID)
      updateSession.mutate(
        {
          sessionId: plannedSessionId,
          scheduledDate: newDate,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Session moved',
              description: `Moved to ${format(parseISO(newDate), 'MMM d, yyyy')}`,
            });
            // CRITICAL: Mark drag operation complete to prevent useAutoMatchSessions from interfering
            markDragOperationComplete();
            // PHASE F4: Invalidate aggressively
            queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['calendarWeek'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['calendarSeason'], exact: false });
          },
          onError: (error) => {
            console.error('Failed to move session:', error);
            toast({
              title: 'Move failed',
              description: 'Failed to move session. Please try again.',
              variant: 'destructive',
            });
          },
        }
      );
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDraggedSession(null);
  };

  const handleDeleteActivityClick = (e: React.MouseEvent, activity: CompletedActivity) => {
    e.stopPropagation();
    setDeleteActivityDialog({ open: true, activity });
  };

  const handleDeleteActivityConfirm = async () => {
    if (!deleteActivityDialog.activity) return;
    
    try {
      await deleteActivityMutation.mutateAsync(deleteActivityDialog.activity.id);
      toast({
        title: 'Activity deleted',
        description: 'The activity has been deleted.',
      });
      setDeleteActivityDialog({ open: false, activity: null });
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the activity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSessionClick = (e: React.MouseEvent, session: CalendarSession) => {
    e.stopPropagation();
    setDeleteSessionDialog({ open: true, session });
  };

  const handleDeleteSessionConfirm = async () => {
    if (!deleteSessionDialog.session) return;
    
    try {
      await deletePlannedSessionMutation.mutateAsync(deleteSessionDialog.session.id);
      toast({
        title: 'Planned session deleted',
        description: 'The planned session has been deleted.',
      });
      setDeleteSessionDialog({ open: false, session: null });
    } catch (error) {
      console.error('Failed to delete planned session:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the planned session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={allPlannedSessionIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-7 grid-rows-6 min-h-[960px]">
            {days.map((day, idx) => {
              const { planned, completed, plannedSessions, completedSessions } = getWorkoutsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <DroppableDayCell
                  key={idx}
                  date={day}
                  className={cn(
                    'h-full min-h-[160px] p-3 border-b border-r border-border flex flex-col',
                    !isCurrentMonth && 'bg-muted/30',
                    idx % 7 === 6 && 'border-r-0'
                  )}
                >
              {/* Day number */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className={cn(
                    'text-sm font-semibold',
                    !isCurrentMonth && 'text-muted-foreground',
                    isCurrentDay &&
                      'bg-accent text-accent-foreground w-6 h-6 rounded-full flex items-center justify-center'
                  )}
                >
                  {format(day, 'd')}
                </span>
              </div>

              {/* Workouts */}
              <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                {(() => {
                  const MAX_VISIBLE = 2;
                  const visiblePlanned = planned.slice(0, MAX_VISIBLE);
                  const remainingPlanned = Math.max(0, planned.length - MAX_VISIBLE);
                  
                  return (
                    <>
                      {visiblePlanned.map((workout) => {
                  // Guard against undefined sport
                  if (!workout.sport) {
                    console.warn('[MonthView] Workout missing sport:', workout);
                    return null;
                  }

                  const Icon = getSportIcon(workout.sport);
                  const session = plannedSessions.find(s => s.id === workout.id);
                  
                  if (!session) return null;
                  
                  // Find matching activity using canonical pairing criteria (lookup-only, never synthesize)
                  // Priority: activity with workout_id matching session.workout_id, or planned_session_id matching session.id
                  const matchingActivity = completed.find(a => 
                    (session.workout_id && a.workout_id === session.workout_id) ||
                    a.planned_session_id === session.id
                  ) || null;
                  
                  // Find matching completed session for display purposes
                  const matchingCompletedSession = completedSessions.find(s => {
                    if (!s || !s.type) return false;
                    // Match by workout_id if available, otherwise by ID
                    if (session.workout_id && s.workout_id === session.workout_id) return true;
                    if (s.id === session.id) return true;
                    return false;
                  });
                  
                  const isCompleted = !!matchingActivity;
                  const completedSession = matchingCompletedSession || null;

                  // Check if session was moved after completion (has activity but dates don't match)
                  const sessionDateStr = session.date ? format(new Date(session.date), 'yyyy-MM-dd') : '';
                  const activityDateStr = matchingActivity?.date || '';
                  const isMoved = !!matchingActivity && sessionDateStr !== activityDateStr;
                  
                  // Check if session is paired (has completed_activity_id)
                  // Frontend invariant: UI = lookup only, backend = authority
                  const isPaired = Boolean(session.completed_activity_id);

                  const handlePairingIconClick = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    if (matchingActivity && isPaired) {
                      setSelectedPairingActivity(matchingActivity);
                      setSelectedPairingSession(completedSession || session);
                      setPairingModalOpen(true);
                    }
                  };
                  
                  // Format duration
                  const duration = session.duration_minutes || workout.duration || 0;
                  const durationHours = Math.floor(duration / 60);
                  const durationMinutes = duration % 60;
                  const durationStr = durationHours > 0 
                    ? `${durationHours}h ${durationMinutes}m`
                    : `${durationMinutes}m`;
                  
                  // Get intensity for badge
                  const intensity = session.intensity || workout.intent || null;
                  const intensityLower = intensity?.toLowerCase() || '';
                  
                  // Determine intensity badge variant
                  let intensityBadgeClass = 'bg-blue-100 text-blue-700 border-blue-200';
                  if (intensityLower.includes('easy') || intensityLower.includes('recovery') || intensityLower.includes('aerobic')) {
                    intensityBadgeClass = 'bg-green-100 text-green-700 border-green-200';
                  } else if (intensityLower.includes('hard') || intensityLower.includes('threshold') || intensityLower.includes('interval')) {
                    intensityBadgeClass = 'bg-red-100 text-red-700 border-red-200';
                  } else if (intensityLower.includes('moderate') || intensityLower.includes('tempo')) {
                    intensityBadgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                  }

                  return (
                    <DraggablePlannedSession
                      key={workout.id || `planned-${workout.date}-${workout.title}`}
                      session={session}
                      workout={workout}
                      isCompleted={isCompleted}
                      matchingActivity={matchingActivity || null}
                      onClick={() => onActivityClick?.(workout, matchingActivity || null, completedSession || session || null)}
                    >
                      <div
                        className={cn(
                          'rounded-lg px-3 py-2 min-h-[56px] flex flex-col justify-center shadow-sm group hover:ring-1 hover:ring-accent/50 transition-all',
                          isCompleted
                            ? 'bg-green-100 border border-green-300'
                            : 'bg-blue-50 border border-blue-200'
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-sm">{workout.title || 'Untitled Workout'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-xs text-muted-foreground">{durationStr}</span>
                            {isPaired && (
                              <button
                                onClick={handlePairingIconClick}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                aria-label="Activity is paired - view pairing details"
                              >
                                <Link2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                              </button>
                            )}
                            {isMoved && !isPaired && (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Moved" />
                            )}
                            {isCompleted && !isMoved && !isPaired && (
                              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                            )}
                            {!isCompleted && !isMoved && (
                              <div className="h-2 w-2 rounded-full border border-muted-foreground/30 shrink-0" aria-label="Unmatched" />
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => handleDeleteSessionClick(e, session)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Planned Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {intensity && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs border', intensityBadgeClass)}
                            >
                              {intensity}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </DraggablePlannedSession>
                  );
                  })}
                      {remainingPlanned > 0 && (
                        <div className="text-xs text-muted-foreground px-3 py-1">
                          +{remainingPlanned} more
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Completed activities without a plan */}
                {(() => {
                  const MAX_VISIBLE_COMPLETED = 2;
                  const unplannedCompleted = completed.filter(c => {
                    // Guard against invalid activities
                    if (!c || !c.sport) {
                      console.warn('[MonthView] Invalid completed activity:', c);
                      return false;
                    }
                    return !planned.some(p => normalizeSportType(p.sport) === normalizeSportType(c.sport));
                  });
                  const visibleCompleted = unplannedCompleted.slice(0, MAX_VISIBLE_COMPLETED);
                  const remainingCompleted = Math.max(0, unplannedCompleted.length - MAX_VISIBLE_COMPLETED);
                  
                  return (
                    <>
                      {visibleCompleted.map((activity) => {
                        // Double-check sport exists (should be filtered above, but extra safety)
                        if (!activity.sport) {
                          return null;
                        }

                        const Icon = getSportIcon(activity.sport);
                        const completedSession = completedSessions.find(s => s.id === activity.id) || null;
                        
                        // Format duration
                        const duration = activity.duration || 0;
                        const durationHours = Math.floor(duration / 60);
                        const durationMinutes = duration % 60;
                        const durationStr = durationHours > 0 
                          ? `${durationHours}h ${durationMinutes}m`
                          : `${durationMinutes}m`;
                        
                        return (
                          <div
                            key={activity.id || `completed-${activity.date}-${activity.title}`}
                            className="rounded-lg px-3 py-2 min-h-[56px] flex flex-col justify-center bg-green-100 border border-green-300 shadow-sm cursor-pointer hover:ring-1 hover:ring-accent/50 transition-all"
                            onClick={() => onActivityClick?.(null, activity, completedSession)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="font-medium text-sm">{activity.title || 'Untitled Activity'}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs text-muted-foreground">{durationStr}</span>
                                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-3.5 w-3.5" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => handleDeleteActivityClick(e, activity)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Activity
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {remainingCompleted > 0 && (
                        <div className="text-xs text-muted-foreground px-3 py-1">
                          +{remainingCompleted} more
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
                </DroppableDayCell>
              );
            })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && draggedSession ? (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground opacity-90 shadow-lg">
              <span className="truncate">{draggedSession.title || 'Untitled Workout'}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      
      {/* Pairing Details Modal */}
      {selectedPairingActivity && (
        <PairingDetailsModal
          open={pairingModalOpen}
          onOpenChange={setPairingModalOpen}
          activity={selectedPairingActivity}
          session={selectedPairingSession}
        />
      )}

      {/* Delete Activity Confirmation Dialog */}
      <AlertDialog open={deleteActivityDialog.open} onOpenChange={(open) => setDeleteActivityDialog({ open, activity: open ? deleteActivityDialog.activity : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this activity will remove execution data but keep the planned workout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteActivityMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivityConfirm}
              disabled={deleteActivityMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteActivityMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Planned Session Confirmation Dialog */}
      <AlertDialog open={deleteSessionDialog.open} onOpenChange={(open) => setDeleteSessionDialog({ open, session: open ? deleteSessionDialog.session : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Planned Session?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteSessionDialog.session?.completed_activity_id
                ? "This session is linked to a completed activity. Deleting it will unpair the activity."
                : "Delete this planned session?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePlannedSessionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSessionConfirm}
              disabled={deletePlannedSessionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlannedSessionMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
