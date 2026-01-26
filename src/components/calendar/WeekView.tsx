import { useMemo, useState, useEffect } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  startOfMonth,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Zap,
  Clock,
  TrendingUp,
  Share2,
  Copy,
  Download,
  Sparkles,
} from 'lucide-react';
import { CombinedSessionCard } from '@/components/schedule/CombinedSessionCard';
import { DayView } from './DayView';
import { WeeklyNarrativeCard } from './WeeklyNarrativeCard';
import { WeeklySummaryCard } from './WeeklySummaryCard';
import { SwipeIndicator } from './SwipeIndicator';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { fetchOverview, fetchWeeklySummary } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useQuery } from '@tanstack/react-query';
import type { PlannedWorkout, CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { capitalizeTitle } from '@/adapters/calendarAdapter';
import { normalizeSportType, mapIntensityToIntent } from '@/lib/session-utils';
import {
  generateWeeklySummaryText,
  generateWeeklySummaryMarkdown,
  copyToClipboard,
  downloadTextFile,
  shareContent,
} from '@/lib/weekly-summary';
import { buildExecutionSummaries } from '@/lib/execution-summary';
import type { ExecutionSummary } from '@/types/execution';
import type { WeeklySummaryCard } from '@/types/calendar';

interface WeekViewProps {
  currentDate: Date;
  onActivityClick?: (
    planned: PlannedWorkout | null,
    completed: CompletedActivity | null,
    session?: CalendarSession | null
  ) => void;
}

function WeekView({ currentDate, onActivityClick }: WeekViewProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryCard | null>(null);
  const isMobile = useIsMobile();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');
  const weekStartISO = format(weekStart, 'yyyy-MM-dd');

  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  const { data: overview } = useQuery({
    queryKey: ['overview', 14],
    queryFn: () => fetchOverview(14),
    retry: 1,
  });

  // Load weekly summary when week changes
  useEffect(() => {
    async function loadSummary() {
      try {
        const summary = await fetchWeeklySummary(weekStartISO);
        setWeeklySummary(summary);
      } catch {
        // Silent failure - don't block render
        setWeeklySummary(null);
      }
    }

    loadSummary();
  }, [weekStartISO]);

  const executionSummariesByDay = useMemo(() => {
    if (!monthData) return new Map<string, ExecutionSummary[]>();

    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, ExecutionSummary[]>();

    for (const day of normalizedDays) {
      if (day.date < format(weekStart, 'yyyy-MM-dd') ||
          day.date > format(weekEnd, 'yyyy-MM-dd')) {
        continue;
      }

      // Combine all planned sessions (from plannedSessions and workouts)
      const allPlannedSessions = [
        ...day.plannedSessions,
        ...day.workouts.filter(w => w.status === 'completed'),
      ];

      // Build execution summaries for this day
      const summaries = buildExecutionSummaries(
        day.date,
        allPlannedSessions,
        day.completedActivities
      );

      map.set(day.date, summaries);
    }

    return map;
  }, [monthData, weekStart, weekEnd]);


  const days = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );

  const getExecutionSummariesForDay = (date: Date): ExecutionSummary[] => {
    const summaries = executionSummariesByDay.get(format(date, 'yyyy-MM-dd'));
    return summaries || [];
  };

  // Get all sessions for the week (for narrative card)
  const weekSessions = useMemo(() => {
    if (!monthData) return [];
    
    const allSessions = [...monthData.planned_sessions, ...monthData.workouts];
    
    return allSessions.filter(session => {
      if (!session.date) return false;
      const sessionDate = parseISO(session.date);
      return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
    });
  }, [monthData, weekStart, weekEnd]);

  // Handle key session click (scroll to session)
  const handleKeySessionClick = (sessionId: string) => {
    // Find the day that contains this session
    const session = weekSessions.find(s => s.id === sessionId);
    if (session && session.date) {
      const sessionDate = parseISO(session.date);
      setSelectedDay(sessionDate);
    }
  };

  const handleOpenSession = (sessionId: string) => {
    // Find the session in monthData and open it via onActivityClick
    if (monthData && onActivityClick) {
      // Try to find as planned session first
      const plannedSession = [...monthData.planned_sessions, ...monthData.workouts].find(
        (s) => s.id === sessionId
      );
      
      if (plannedSession) {
        onActivityClick(
          {
            id: plannedSession.id,
            date: plannedSession.date || '',
            sport: normalizeSportType(plannedSession.type),
            intent: mapIntensityToIntent(plannedSession.intensity),
            title: capitalizeTitle(plannedSession.title || ''),
            description: plannedSession.notes || '',
            duration: plannedSession.duration_minutes || 0,
            distance: plannedSession.distance_km || 0,
            intensity: plannedSession.intensity || 'easy',
          },
          null,
          null
        );
        return;
      }

      // Try to find as activity
      const activity = monthData.activities.find((a) => a.id === sessionId);
      if (activity) {
        onActivityClick(
          null,
          {
            id: activity.id,
            date: activity.date || '',
            sport: normalizeSportType(activity.type),
            title: capitalizeTitle(activity.name || ''),
            duration: activity.duration_minutes || 0,
            distance: activity.distance_km || 0,
            pace: activity.pace || undefined,
            elevation: activity.elevation || undefined,
            hr: activity.hr || undefined,
          },
          null
        );
      }
    }
  };

  const handleCardClick = (summary: ExecutionSummary) => {
    if (monthData && onActivityClick) {
      const session = summary.planned
        ? [...monthData.planned_sessions, ...monthData.workouts].find(
            (s) => s.id === summary.planned!.id
          )
        : null;
      const activity = summary.activity || null;

      onActivityClick(
        session
          ? {
              id: session.id,
              date: session.date || '',
              sport: normalizeSportType(session.type),
              intent: mapIntensityToIntent(session.intensity),
              title: capitalizeTitle(session.title || ''),
              description: session.notes || '',
              duration: session.duration_minutes || 0,
              completed: session.status === 'completed',
            }
          : null,
        activity,
        session || undefined
      );
    }
  };

  if (selectedDay) {
    const summaries = getExecutionSummariesForDay(selectedDay);
    // TODO: Update DayView to accept ExecutionSummary[] instead of CalendarItem[]
    // For now, we'll keep DayView as-is and handle it separately
    return (
      <DayView
        date={selectedDay}
        items={[]}
        onBack={() => setSelectedDay(null)}
        onItemClick={() => {}}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Mobile layout - stacked vertical list
  if (isMobile) {
    const getItemsForDay = (date: Date): ExecutionSummary[] => {
      return getExecutionSummariesForDay(date);
    };

    return (
      <div className="h-full overflow-hidden flex flex-col">
        <SwipeIndicator label="week" className="flex-shrink-0" />
        <div className="flex-1 overflow-y-auto px-1">
          {/* Weekly Summary Card - Mobile */}
          {weeklySummary && (
            <div className="mb-3 px-1">
              <WeeklySummaryCard
                summary={weeklySummary}
                onOpenSession={handleOpenSession}
              />
            </div>
          )}
          {days.map((day) => {
            const summaries = getItemsForDay(day);
            if (summaries.length === 0) return null;

            return (
              <div key={format(day, 'yyyy-MM-dd')} className="mb-3">
                <div className="mb-1 px-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(day, 'EEEE, MMM d')}
                  </p>
                </div>
                <div className="space-y-1.5">
                  {summaries.map((summary, idx) => (
                    <CombinedSessionCard
                      key={summary.planned?.id || summary.activity?.id || idx}
                      executionSummary={summary}
                      onClick={() => handleCardClick(summary)}
                      variant="week"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Weekly Summary Card - Backend-derived execution summary */}
      {weeklySummary && (
        <WeeklySummaryCard
          summary={weeklySummary}
          onOpenSession={handleOpenSession}
        />
      )}

      {/* Weekly Narrative Card */}
      <WeeklyNarrativeCard
        weekStart={format(weekStart, 'yyyy-MM-dd')}
        sessions={weekSessions}
        onKeySessionClick={handleKeySessionClick}
      />

      {/* Week Grid - Desktop */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const isCurrentDay = isToday(day);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-lg border border-border/60 bg-card min-h-[200px] max-h-[280px] flex flex-col',
                isCurrentDay && 'ring-1 ring-accent/40 border-accent/30'
              )}
            >
              {/* Day Header - compact telemetry style */}
              <div
                className="px-2 py-1.5 border-b border-border/40 cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setSelectedDay(day)}
              >
                <p className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest">
                  {format(day, 'EEE').toUpperCase()}
                </p>
                <p
                  className={cn(
                    'text-lg font-semibold tabular-nums tracking-tight',
                    isCurrentDay ? 'text-accent' : 'text-foreground'
                  )}
                >
                  {format(day, 'd')}
                </p>
              </div>

              {/* Card Area */}
              <div className="flex-1 relative">
                <div className="absolute top-0 left-0 right-0 bottom-0 p-1 overflow-y-auto">
                  {(() => {
                    const summaries = getExecutionSummariesForDay(day);
                    
                    if (summaries.length === 0) {
                      return (
                        <div className="h-full flex items-center justify-center">
                          <p className="text-[9px] text-muted-foreground/50 uppercase tracking-wider opacity-50">
                            🧠 Adaptation day
                          </p>
                        </div>
                      );
                    }

                    // Show up to 3 summaries (stacked)
                    const visibleSummaries = summaries.slice(0, 3);
                    const hasMore = summaries.length > 3;

                    return (
                      <div className="h-full flex flex-col gap-1">
                        {visibleSummaries.map((summary, idx) => {
                          const isTopCard = idx === 0;
                          const topSummary = visibleSummaries[0];
                          
                          // Get instructions from top summary's planned session
                          const hasInstructions = isTopCard && topSummary.planned && monthData && (() => {
                            const session = [...monthData.planned_sessions, ...monthData.workouts].find(
                              (s) => s.id === topSummary.planned!.id
                            );
                            return session?.must_dos?.length || (session?.instructions && session.instructions.length > 0);
                          })();
                          
                          const instructionText = isTopCard && topSummary.planned && monthData && (() => {
                            const session = [...monthData.planned_sessions, ...monthData.workouts].find(
                              (s) => s.id === topSummary.planned!.id
                            );
                            return session?.must_dos?.[0] || session?.instructions?.[0];
                          })();

                          return (
                            <div key={summary.planned?.id || summary.activity?.id || idx} className="flex-shrink-0">
                              <CombinedSessionCard
                                executionSummary={summary}
                                onClick={() => handleCardClick(summary)}
                                variant="week"
                              />
                              {/* Instruction / Must-Do box - below top card only */}
                              {hasInstructions && instructionText && (
                                <div className="mt-1 px-2 py-1.5 border-t border-border/40 bg-muted/20 rounded-b">
                                  <div className="flex items-start gap-1.5">
                                    <span className="text-[9px] text-muted-foreground/60 mt-0.5">→</span>
                                    <p className="text-[10px] leading-relaxed text-muted-foreground flex-1">
                                      {instructionText}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {hasMore && (
                          <div className="text-[9px] text-muted-foreground/50 text-center py-1">
                            +{summaries.length - 3} more
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { WeekView };
export default WeekView;
