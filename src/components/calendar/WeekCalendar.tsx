import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  startOfMonth,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Loader2, Zap, Clock, TrendingUp, Share2, Copy, Download, Sparkles } from 'lucide-react';
import { CalendarWorkoutStack } from './cards/CalendarWorkoutStack';
import { DayView } from './DayView';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type {
  CalendarItem,
  GroupedCalendarItem,
} from '@/types/calendar';
import {
  groupDuplicateSessions,
  normalizeCalendarSport,
  normalizeCalendarIntent,
} from '@/types/calendar';
import { fetchCalendarMonth, normalizeCalendarMonth } from '@/lib/calendar-month';
import { fetchOverview } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useQuery } from '@tanstack/react-query';
import type { PlannedWorkout, CompletedActivity, TrainingLoad } from '@/types';
import type { CalendarSession } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { normalizeSportType, mapIntensityToIntent } from '@/lib/session-utils';
import { toCalendarItem, capitalizeTitle } from '@/adapters/calendarAdapter';
import {
  generateWeeklySummaryText,
  generateWeeklySummaryMarkdown,
  copyToClipboard,
  downloadTextFile,
  shareContent,
} from '@/lib/weekly-summary';

interface WeekCalendarProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: CalendarSession | null) => void;
}

/**
 * WeekCalendar Component
 *
 * Expanded week view with vertical stacking and more readable spacing.
 */
export function WeekCalendar({ currentDate, onActivityClick }: WeekCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const monthStart = startOfMonth(currentDate);
  const monthKey = format(monthStart, 'yyyy-MM');
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  const { data: monthData, isLoading } = useAuthenticatedQuery({
    queryKey: ['calendar', 'month', monthKey],
    queryFn: () => fetchCalendarMonth(currentDate),
    retry: 1,
  });

  const { data: overview } = useQuery({
    queryKey: ['overview', 14],
    queryFn: () => fetchOverview(14),
    retry: 1,
    staleTime: 0,
  });

  // Convert to CalendarItems grouped by day
  const dayDataMap = useMemo(() => {
    if (!monthData) return new Map<string, CalendarItem[]>();

    const normalizedDays = normalizeCalendarMonth(monthData);
    const map = new Map<string, CalendarItem[]>();

    for (const day of normalizedDays) {
      // Filter to week range
      if (day.date < weekStartStr || day.date > weekEndStr) continue;

      const items: CalendarItem[] = [];

      for (const session of day.plannedSessions) {
        items.push(toCalendarItem(session, monthData.completed_activities || []));
      }

      for (const workout of day.workouts) {
        if (!items.some(i => i.id === workout.id)) {
          items.push(toCalendarItem(workout, monthData.completed_activities || []));
        }
      }

      map.set(day.date, items);
    }

    return map;
  }, [monthData, weekStartStr, weekEndStr]);

  const activityIdBySessionId = useMemo(() => {
    if (!monthData) return {};
    const map: Record<string, string> = {};
    for (const session of [...monthData.planned_sessions, ...monthData.workouts]) {
      if (session.completed_activity_id) {
        map[session.id] = session.completed_activity_id;
      }
    }
    for (const activity of monthData.completed_activities || []) {
      if (activity.planned_session_id) {
        map[activity.planned_session_id] = activity.id;
      }
    }
    return map;
  }, [monthData]);

  // Weekly summary data
  const weeklySummary = useMemo(() => {
    let totalDuration = 0;
    let totalLoad = 0;
    let completedSessions = 0;
    let plannedSessions = 0;

    dayDataMap.forEach((items) => {
      for (const item of items) {
        totalDuration += item.durationMin;
        totalLoad += item.load || 0;
        if (item.kind === 'completed') completedSessions++;
        else plannedSessions++;
      }
    });

    return { totalDuration, totalLoad, completedSessions, plannedSessions };
  }, [dayDataMap]);

  // Weekly insight from training load
  const weeklyInsight = useMemo(() => {
    if (!overview?.metrics) return null;

    const ctlData = Array.isArray(overview.metrics.ctl) ? overview.metrics.ctl : [];
    const tsbData = Array.isArray(overview.metrics.tsb) ? overview.metrics.tsb : [];

    if (ctlData.length < 7) return null;

    const latest = tsbData[tsbData.length - 1];
    const tsbCurrent = Array.isArray(latest) ? latest[1] : 0;

    let insight = '';
    let color = 'text-muted-foreground';

    if (tsbCurrent > 15) {
      insight = "You're well-rested and ready for hard training.";
      color = 'text-emerald-600 dark:text-emerald-400';
    } else if (tsbCurrent > 0) {
      insight = "You're in good form with balanced recovery.";
      color = 'text-blue-600 dark:text-blue-400';
    } else if (tsbCurrent > -15) {
      insight = "You're productively fatigued from training.";
      color = 'text-muted-foreground';
    } else if (tsbCurrent > -25) {
      insight = 'Consider recovery - significant fatigue accumulated.';
      color = 'text-amber-600 dark:text-amber-400';
    } else {
      insight = 'Prioritize recovery this week.';
      color = 'text-red-600 dark:text-red-400';
    }

    return { insight, color };
  }, [overview]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  const getGroupedItemsForDay = (date: Date): GroupedCalendarItem[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const items = dayDataMap.get(dateStr);
    if (!items || items.length === 0) return [];
    return groupDuplicateSessions(items);
  };

  const handleCardClick = (item: CalendarItem) => {
    if (monthData && onActivityClick) {
      const session = [...monthData.planned_sessions, ...monthData.workouts].find(
        (s) => s.id === item.id
      );
      const activity = monthData.completed_activities.find(
        (a) => a.id === item.id || a.planned_session_id === item.id
      );

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
        activity || null,
        session
      );
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    const summaryData = {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      plannedSessions: weeklySummary.plannedSessions,
      completedSessions: weeklySummary.completedSessions,
      totalLoad: weeklySummary.totalLoad,
      insight: weeklyInsight?.insight || '',
    };
    const text = generateWeeklySummaryText(summaryData);
    const success = await shareContent('Weekly Training Summary', text);
    if (!success) {
      const copied = await copyToClipboard(text);
      if (copied) {
        toast({ title: 'Copied to clipboard' });
      }
    }
    setIsSharing(false);
  };

  const handleCopy = async () => {
    const summaryData = {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      plannedSessions: weeklySummary.plannedSessions,
      completedSessions: weeklySummary.completedSessions,
      totalLoad: weeklySummary.totalLoad,
      insight: weeklyInsight?.insight || '',
    };
    const text = generateWeeklySummaryText(summaryData);
    const copied = await copyToClipboard(text);
    if (copied) {
      toast({ title: 'Copied to clipboard' });
    }
  };

  const handleDownload = () => {
    const summaryData = {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      plannedSessions: weeklySummary.plannedSessions,
      completedSessions: weeklySummary.completedSessions,
      totalLoad: weeklySummary.totalLoad,
      insight: weeklyInsight?.insight || '',
    };
    const markdown = generateWeeklySummaryMarkdown(summaryData);
    const filename = `weekly-summary-${weekStartStr}.md`;
    downloadTextFile(markdown, filename, 'text/markdown');
    toast({ title: 'Downloaded' });
  };

  // Show day view if a day is selected
  if (selectedDay) {
    const dateStr = format(selectedDay, 'yyyy-MM-dd');
    const items = dayDataMap.get(dateStr) || [];

    return (
      <DayView
        date={selectedDay}
        items={items}
        onBack={() => setSelectedDay(null)}
        onItemClick={handleCardClick}
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
    <div className="space-y-4">
      {/* Weekly Summary Card */}
      <GlassCard className="border-0 shadow-sm bg-gradient-to-br from-muted/30 to-muted/10">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{weeklySummary.totalDuration}</p>
                  <p className="text-xs text-muted-foreground">minutes</p>
                </div>
              </div>

              {weeklySummary.totalLoad > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-500/10">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{Math.round(weeklySummary.totalLoad)}</p>
                    <p className="text-xs text-muted-foreground">TSS</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {weeklySummary.completedSessions}/{weeklySummary.completedSessions + weeklySummary.plannedSessions}
                  </p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {weeklyInsight && (
                <div className="flex items-center gap-2 max-w-xs">
                  <Sparkles className={cn('h-4 w-4 flex-shrink-0', weeklyInsight.color)} />
                  <p className={cn('text-sm', weeklyInsight.color)}>{weeklyInsight.insight}</p>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isSharing}>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCopy}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </GlassCard>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-3">
        {days.map((day, idx) => {
          const groupedItems = getGroupedItemsForDay(day);
          const isCurrentDay = isToday(day);
          const dayItems = dayDataMap.get(format(day, 'yyyy-MM-dd')) || [];
          const dayTotal = dayItems.reduce((sum, i) => sum + i.durationMin, 0);

          return (
            <div
              key={idx}
              className={cn(
                'rounded-xl border border-border bg-card overflow-hidden min-h-[340px] flex flex-col',
                isCurrentDay && 'ring-2 ring-primary/50',
              )}
            >
              {/* Day Header */}
              <div
                className={cn(
                  'px-3 py-2 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors',
                  isCurrentDay && 'bg-primary/5',
                )}
                onClick={() => setSelectedDay(day)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {format(day, 'EEE')}
                    </p>
                    <p
                      className={cn(
                        'text-lg font-bold',
                        isCurrentDay ? 'text-primary' : 'text-foreground',
                      )}
                    >
                      {format(day, 'd')}
                    </p>
                  </div>
                  {dayTotal > 0 && (
                    <span className="text-xs text-muted-foreground">{dayTotal}m</span>
                  )}
                </div>
              </div>

              {/* Workout Cards */}
              <div className="flex-1 relative">
                {groupedItems.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-xs text-muted-foreground/50">Rest day</p>
                  </div>
                ) : (
                  <div className="absolute top-0 left-0 right-0 bottom-0">
                    <CalendarWorkoutStack
                      items={groupedItems.flatMap((group) => group.items)}
                      variant="week"
                      onClick={handleCardClick}
                      maxVisible={3}
                      activityIdBySessionId={activityIdBySessionId}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
