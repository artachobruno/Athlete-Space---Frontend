import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
  parseISO,
  isPast,
  startOfMonth,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchActivities, fetchOverview, type CalendarSession } from '@/lib/api';
import { useUpdatePlannedSession, useUpdateWorkoutDate } from '@/hooks/useCalendarMutations';
import { fetchCalendarMonth, normalizeCalendarMonth, type DayCalendarData } from '@/lib/calendar-month';
import { mapSessionToWorkout, normalizeSportType } from '@/lib/session-utils';
import { Footprints, Bike, Waves, Clock, Route, CheckCircle2, MessageCircle, Loader2, Sparkles, Share2, Copy, Download, AlertTriangle, Link2, MoreVertical, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import type { PlannedWorkout, CompletedActivity, TrainingLoad } from '@/types';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { 
  generateWeeklySummaryText, 
  generateWeeklySummaryMarkdown,
  copyToClipboard,
  downloadTextFile,
  shareContent 
} from '@/lib/weekly-summary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DraggablePlannedSession } from './DraggablePlannedSession';
import { DroppableDayCell } from './DroppableDayCell';
import { PairingDetailsModal } from './PairingDetailsModal';
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

interface WeekViewProps {
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

const intentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
};

export function WeekView({ currentDate, onActivityClick }: WeekViewProps) {
  const { convertDistance } = useUnitSystem();
  const queryClient = useQueryClient();
  const updateSession = useUpdatePlannedSession();
  const updateWorkout = useUpdateWorkoutDate();
  const [isSharing, setIsSharing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedSession, setDraggedSession] = useState<CalendarSession | null>(null);
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [selectedPairingActivity, setSelectedPairingActivity] = useState<CompletedActivity | null>(null);
  const [selectedPairingSession, setSelectedPairingSession] = useState<CalendarSession | null>(null);
  const deleteActivityMutation = useDeleteActivity();
  const deletePlannedSessionMutation = useDeletePlannedSession();
  const [deleteActivityDialog, setDeleteActivityDialog] = useState<{ open: boolean; activity: CompletedActivity | null }>({ open: false, activity: null });
  const [deleteSessionDialog, setDeleteSessionDialog] = useState<{ open: boolean; session: CalendarSession | null }>({ open: false, session: null });
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');

  // Fetch month data (includes planned sessions, completed activities, and workouts)
  // CRITICAL: Use useAuthenticatedQuery to gate behind auth and prevent race conditions
  const { data: monthData, isLoading: monthLoading, error: monthError } = useAuthenticatedQuery({
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

  // Filter to week range
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
  
  // Get week data from month data
  const weekData = useMemo(() => {
    if (!monthData) return null;
    
    const weekSessions: CalendarSession[] = [];
    const weekActivities: CompletedActivity[] = [];
    
    // Filter sessions and activities to week range
    for (const session of [...monthData.planned_sessions, ...monthData.workouts]) {
      if (session.date && session.date >= weekStartStr && session.date <= weekEndStr) {
        weekSessions.push(session);
      }
    }
    
    for (const activity of monthData.completed_activities) {
      if (activity.date && activity.date >= weekStartStr && activity.date <= weekEndStr) {
        weekActivities.push(activity);
      }
    }
    
    return {
      week_start: weekStartStr,
      week_end: weekEndStr,
      sessions: weekSessions,
      activities: weekActivities,
    };
  }, [monthData, weekStartStr, weekEndStr]);

  // Debug logging
  if (weekData) {
    console.log('[WeekView] Week data from month:', {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      sessionsCount: weekData.sessions?.length || 0,
      activitiesCount: weekData.activities?.length || 0,
    });
  }
  if (monthError) {
    console.error('[WeekView] Error loading month data:', monthError);
  }

  const { data: overview } = useQuery({
    queryKey: ['overview', 14],
    queryFn: () => {
      console.log('[WeekView] Fetching overview for 14 days');
      return fetchOverview(14);
    },
    retry: 1,
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });

  const weeklyInsight = useMemo(() => {
    if (!overview?.metrics) return null;
    
    const ctlData = Array.isArray(overview.metrics.ctl) ? overview.metrics.ctl : [];
    const atlData = Array.isArray(overview.metrics.atl) ? overview.metrics.atl : [];
    const tsbData = Array.isArray(overview.metrics.tsb) ? overview.metrics.tsb : [];
    
    if (ctlData.length < 7) return null;
    
    const trainingLoadData: TrainingLoad[] = ctlData.map((item, index) => {
      // Ensure item is an array with at least 2 elements
      if (!Array.isArray(item) || item.length < 2) {
        return {
          date: '',
          ctl: 0,
          atl: 0,
          tsb: 0,
          dailyLoad: 0,
        };
      }
      const [date, ctl] = item;
      return {
        date,
        ctl,
        atl: atlData[index]?.[1] || 0,
        tsb: tsbData[index]?.[1] || 0,
        dailyLoad: 0,
      };
    }).slice(-14);
    
    const latest = trainingLoadData[trainingLoadData.length - 1];
    const weekAgo = trainingLoadData[Math.max(0, trainingLoadData.length - 7)];
    const ctlTrend = latest.ctl - weekAgo.ctl;
    const tsbCurrent = latest.tsb;
    
    let insight = '';
    let color = 'text-muted-foreground';
    
    if (tsbCurrent > 15) {
      insight = 'You\'re well-rested and ready for hard training this week.';
      color = 'text-load-fresh';
    } else if (tsbCurrent > 0) {
      insight = 'You\'re in good form with balanced recovery.';
      color = 'text-load-optimal';
    } else if (tsbCurrent > -15) {
      insight = 'You\'re productively fatigued from training.';
      color = 'text-muted-foreground';
    } else if (tsbCurrent > -25) {
      insight = 'You\'re accumulating significant fatigue - consider recovery.';
      color = 'text-load-overreaching';
    } else {
      insight = 'Signs of overreaching - prioritize recovery this week.';
      color = 'text-load-overtraining';
    }
    
    if (ctlTrend > 2) {
      insight += ' Fitness is trending upward.';
    } else if (ctlTrend < -2) {
      insight += ' Focus on consistency to rebuild momentum.';
    }
    
    return { insight, color };
  }, [overview]);

  const weeklySummaryData = useMemo(() => {
    if (!weekData || !overview) return null;
    
    const sessionsArray = Array.isArray(weekData?.sessions) ? weekData.sessions : [];
    // FE-3: Remove invalid filters - count sessions that aren't explicitly excluded
    const plannedSessions = sessionsArray.filter(s => s?.status !== 'completed' && s?.status !== 'cancelled' && s?.status !== 'skipped').length;
    const completedSessions = sessionsArray.filter(s => s?.status === 'completed').length;
    
    const ctlData = Array.isArray(overview.metrics.ctl) ? overview.metrics.ctl : [];
    const atlData = Array.isArray(overview.metrics.atl) ? overview.metrics.atl : [];
    const tsbData = Array.isArray(overview.metrics.tsb) ? overview.metrics.tsb : [];
    
    const trainingLoadData: TrainingLoad[] = ctlData.map((item, index) => {
      // Ensure item is an array with at least 2 elements
      if (!Array.isArray(item) || item.length < 2) {
        return {
          date: '',
          ctl: 0,
          atl: 0,
          tsb: 0,
          dailyLoad: 0,
        };
      }
      const [date, ctl] = item;
      return {
        date: typeof date === 'string' ? date : '',
        ctl: typeof ctl === 'number' ? ctl : 0,
        atl: (Array.isArray(atlData[index]) && typeof atlData[index][1] === 'number') ? atlData[index][1] : 0,
        tsb: (Array.isArray(tsbData[index]) && typeof tsbData[index][1] === 'number') ? tsbData[index][1] : 0,
        dailyLoad: 0,
      };
    }).filter(item => item.date !== '').slice(-14);
    
    const activitiesArray = Array.isArray(weekData?.activities) ? weekData.activities : [];
    const totalLoad = activitiesArray.reduce((sum, a) => {
      if (!a || typeof a !== 'object' || !a.date) return sum;
      // Only sum numeric training load values (explicitly check for number type)
      return sum + (typeof a.trainingLoad === 'number' ? a.trainingLoad : 0);
    }, 0);
    
    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      plannedSessions,
      completedSessions,
      totalLoad: Math.round(totalLoad),
      insight: weeklyInsight?.insight || '',
      trainingLoad: trainingLoadData.length >= 7 ? trainingLoadData : undefined,
    };
  }, [weekData, overview, weeklyInsight]);

  const handleShare = async () => {
    if (!weeklySummaryData) return;
    
    setIsSharing(true);
    const text = generateWeeklySummaryText(weeklySummaryData);
    const success = await shareContent('Weekly Training Summary', text);
    
    if (!success) {
      // Fallback to copy
      const copied = await copyToClipboard(text);
      if (copied) {
        toast({
          title: 'Copied to clipboard',
          description: 'Weekly summary copied to clipboard',
        });
      }
    }
    setIsSharing(false);
  };

  const handleCopy = async () => {
    if (!weeklySummaryData) return;
    
    const text = generateWeeklySummaryText(weeklySummaryData);
    const copied = await copyToClipboard(text);
    
    if (copied) {
      toast({
        title: 'Copied to clipboard',
        description: 'Weekly summary copied to clipboard',
      });
    }
  };

  const handleDownload = () => {
    if (!weeklySummaryData) return;
    
    const markdown = generateWeeklySummaryMarkdown(weeklySummaryData);
    const filename = `weekly-summary-${format(weekStart, 'yyyy-MM-dd')}.md`;
    downloadTextFile(markdown, filename, 'text/markdown');
    
    toast({
      title: 'Downloaded',
      description: 'Weekly summary downloaded',
    });
  };

  const days = useMemo(() => {
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate, weekStart]);

  const getWorkoutsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = dayDataMap.get(dateStr);
    
    if (!dayData) {
      return { planned: [], completed: [], plannedSessions: [] };
    }
    
    // Map planned sessions to workouts
    const planned = dayData.plannedSessions
      .map(mapSessionToWorkout)
      .filter((w): w is PlannedWorkout => w !== null);
    
    // Completed activities MUST ONLY come from /activities endpoint
    // Never synthesize them from workouts - workouts are containers, not executions
    // The rendering code will do lookup-only pairing when displaying workouts
    const completed = dayData.completedActivities;
    
    return {
      planned,
      completed,
      plannedSessions: dayData.plannedSessions,
    };
  };

  // Get all planned session IDs for SortableContext
  const allPlannedSessionIds = useMemo(() => {
    if (!monthData) return [];
    return monthData.planned_sessions
      .filter(s => {
        const sessionDate = s.date || '';
        return sessionDate >= weekStartStr && sessionDate <= weekEndStr;
      })
      .map(s => s.id);
  }, [monthData, weekStartStr, weekEndStr]);

  const handleDragStart = (event: DragStartEvent) => {
    const activeData = event.active.data.current;
    if (!activeData?.session) return;
    
    const session = activeData.session as CalendarSession;
    
    // CRITICAL: Block drag if planned_session_id is missing
    // Drag only allowed when planned_session_id exists
    if (!session.planned_session_id) {
      console.warn('[WeekView] Blocked drag: missing planned_session_id', session);
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
      console.warn('[WeekView] Blocked move: missing planned_session_id', session);
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

  if (monthLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (monthError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">Unable to load calendar data</p>
        <p className="text-xs text-muted-foreground">
          {monthError instanceof Error ? monthError.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  // Show debug info if no sessions found
  if (weekData && (!weekData.sessions || weekData.sessions.length === 0)) {
    console.warn('[WeekView] No sessions found in week data:', weekData);
  }

  return (
    <div className="space-y-4">
      {/* Weekly Insight */}
      {weeklyInsight && (
        <Card className="bg-accent/5 border-accent/20">
          <div className="p-4 flex items-start gap-3">
            <div className={cn('p-2 rounded-lg bg-accent/10', weeklyInsight.color)}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Weekly Insight
                </div>
                {weeklySummaryData && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        disabled={isSharing}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopy}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Text
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Markdown
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className={cn('text-sm leading-relaxed', weeklyInsight.color)}>
                {weeklyInsight.insight}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Week Grid */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={allPlannedSessionIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {days.map((day) => {
            const { planned, completed, plannedSessions } = getWorkoutsForDay(day);
            const isCurrentDay = isToday(day);

            return (
              <DroppableDayCell key={day.toString()} date={day}>
                <Card
                  className={cn(
                    'h-full min-h-[300px] p-3 flex flex-col',
                    isCurrentDay && 'ring-2 ring-accent'
                  )}
                >
            {/* Day header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs text-muted-foreground">
                  {format(day, 'EEEE')}
                </div>
                <div
                  className={cn(
                    'text-lg font-semibold',
                    isCurrentDay && 'text-accent'
                  )}
                >
                  {format(day, 'd')}
                </div>
              </div>
              {isCurrentDay && (
                <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
                  Today
                </Badge>
              )}
            </div>

            {/* Workouts */}
            <div className="flex-1 flex flex-col space-y-2">
              {planned.length === 0 && completed.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center">
                    Rest day
                  </p>
                </div>
              )}

              {planned.map((workout) => {
                // Guard against undefined sport
                if (!workout.sport) {
                  console.warn('[WeekView] Workout missing sport:', workout);
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
                
                const isCompleted = !!matchingActivity;

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
                    setSelectedPairingSession(session);
                    setPairingModalOpen(true);
                  }
                };

                return (
                  <DraggablePlannedSession
                    key={workout.id || `planned-${workout.date}-${workout.title}`}
                    session={session}
                    workout={workout}
                    isCompleted={isCompleted}
                    matchingActivity={matchingActivity || null}
                    onClick={() => onActivityClick?.(workout, matchingActivity || null, session || null)}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg border transition-all hover:ring-1 hover:ring-accent/50',
                        isCompleted
                          ? 'bg-load-fresh/10 border-load-fresh/30'
                          : 'bg-muted/50 border-border'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">
                          {workout.title}
                        </span>
                        <div className="ml-auto shrink-0 flex items-center gap-1">
                          {isPaired && (
                            <button
                              onClick={handlePairingIconClick}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              aria-label="Activity is paired - view pairing details"
                            >
                              <Link2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            </button>
                          )}
                          {isMoved && !isPaired && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" aria-label="Session moved after completion" />
                          )}
                          {isCompleted && !isMoved && !isPaired && (
                            <CheckCircle2 className="h-4 w-4 text-load-fresh" />
                          )}
                          {!isCompleted && !isMoved && (
                            <div className="h-3 w-3 rounded-full border border-muted-foreground/30" aria-label="Unmatched" />
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {workout.duration}m
                        </span>
                        {workout.distance !== undefined && workout.distance > 0 && (
                          <span className="flex items-center gap-1">
                            <Route className="h-3 w-3" />
                            {(() => {
                              const dist = convertDistance(workout.distance);
                              return `${dist.value.toFixed(1)}${dist.unit}`;
                            })()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', intentColors[workout.intent])}
                        >
                          {workout.intent}
                        </Badge>
                        <MessageCircle className="h-3 w-3 text-muted-foreground opacity-50" />
                      </div>
                    </div>
                  </DraggablePlannedSession>
                );
              })}

              {/* Completed without plan */}
              {completed
                .filter(c => {
                  // Guard against invalid activities
                  if (!c || !c.sport) {
                    console.warn('[WeekView] Invalid completed activity:', c);
                    return false;
                  }
                  return !planned.some(p => normalizeSportType(p.sport) === normalizeSportType(c.sport));
                })
                .map((activity) => {
                  // Double-check sport exists (should be filtered above, but extra safety)
                  if (!activity.sport) {
                    return null;
                  }

                  const Icon = getSportIcon(activity.sport);
                  const isActivityPaired = Boolean(activity.planned_session_id);
                  return (
                    <div
                      key={activity.id || `completed-${activity.date}-${activity.title}`}
                      className="p-2 rounded-lg border bg-accent/10 border-accent/30 cursor-pointer hover:ring-1 hover:ring-accent/50"
                      onClick={() => onActivityClick?.(null, activity)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium truncate">
                          {activity.title}
                        </span>
                        <div className="ml-auto shrink-0">
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {activity.duration}m
                        </span>
                        <span className="flex items-center gap-1">
                          <Route className="h-3 w-3" />
                          {(() => {
                            const dist = convertDistance(activity.distance || 0);
                            return `${dist.value.toFixed(1)}${dist.unit}`;
                          })()}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
                </Card>
              </DroppableDayCell>
            );
          })}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeId && draggedSession ? (
            <div className="p-2 rounded-lg border bg-muted/50 border-border opacity-90 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium">
                  {draggedSession.title || 'Untitled Workout'}
                </span>
              </div>
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
