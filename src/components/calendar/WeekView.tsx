import { useMemo, useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { fetchOverview } from '@/lib/api';
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

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');

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

  return (
    <div className="space-y-3">
      {/* Weekly Narrative Card */}
      <WeeklyNarrativeCard
        weekStart={format(weekStart, 'yyyy-MM-dd')}
        sessions={weekSessions}
        onKeySessionClick={handleKeySessionClick}
      />

      {/* Week Grid */}
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
