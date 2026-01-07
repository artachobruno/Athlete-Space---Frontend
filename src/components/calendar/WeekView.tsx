import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameDay,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { fetchCalendarWeek, fetchActivities, fetchOverview } from '@/lib/api';
import { mapSessionToWorkout } from '@/lib/session-utils';
import { Footprints, Bike, Waves, Clock, Route, CheckCircle2, MessageCircle, Loader2, Sparkles, Share2, Copy, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
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

interface WeekViewProps {
  currentDate: Date;
  onActivityClick?: (planned: PlannedWorkout | null, completed: CompletedActivity | null, session?: import('@/lib/api').CalendarSession | null) => void;
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

export function WeekView({ currentDate, onActivityClick }: WeekViewProps) {
  const { convertDistance } = useUnitSystem();
  const [isSharing, setIsSharing] = useState(false);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data: weekData, isLoading: weekLoading, error: weekError } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  // Debug logging
  if (weekData) {
    console.log('[WeekView] Week data received:', weekData);
    console.log('[WeekView] Sessions count:', weekData.sessions?.length || 0);
  }
  if (weekError) {
    console.error('[WeekView] Error loading week data:', weekError);
  }

  // Use consistent query key to share cache with other components
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: overview } = useQuery({
    queryKey: ['overview', 14],
    queryFn: () => fetchOverview(14),
    retry: 1,
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
    const plannedSessions = sessionsArray.filter(s => s?.status === 'planned').length;
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
    
    const activitiesArray = Array.isArray(activities) ? activities : [];
    const totalLoad = activitiesArray.reduce((sum, a) => {
      if (!a || typeof a !== 'object') return sum;
      const activityDate = a.date?.split('T')[0] || a.date;
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      if (activityDate >= weekStartStr && activityDate <= weekEndStr) {
        return sum + (a.trainingLoad || 0);
      }
      return sum;
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
  }, [weekData, overview, activities, weekStart, weekEnd, weeklyInsight]);

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
    
    // Ensure sessions is an array
    const sessionsArray = Array.isArray(weekData?.sessions) ? weekData.sessions : [];
    
    // Debug logging for specific day
    if (sessionsArray.length > 0) {
      const allSessionsForDay = sessionsArray.filter(s => s?.date === dateStr);
      if (allSessionsForDay.length > 0) {
        console.log(`[WeekView] Found ${allSessionsForDay.length} sessions for ${dateStr}:`, allSessionsForDay);
      }
    }
    
    const plannedSessions = sessionsArray.filter(s => {
      if (!s || typeof s !== 'object') return false;
      // Normalize date strings for comparison (handle timezone issues)
      const sessionDate = s.date?.split('T')[0] || s.date;
      return sessionDate === dateStr && s.status === 'planned';
    });
    
    const planned = plannedSessions.map(mapSessionToWorkout).filter((w): w is PlannedWorkout => w !== null);
    const activitiesArray = Array.isArray(activities) ? activities : [];
    const completed = activitiesArray.filter((a: CompletedActivity) => {
      if (!a || typeof a !== 'object') return false;
      const activityDate = a.date?.split('T')[0] || a.date;
      return activityDate === dateStr;
    });
    return { planned, completed, plannedSessions };
  };

  if (weekLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (weekError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground mb-2">Unable to load calendar data</p>
        <p className="text-xs text-muted-foreground">
          {weekError instanceof Error ? weekError.message : 'Unknown error'}
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
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
      {days.map((day) => {
        const { planned, completed, plannedSessions } = getWorkoutsForDay(day);
        const isCurrentDay = isToday(day);

        return (
          <Card
            key={day.toString()}
            className={cn(
              'p-3',
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
            <div className="space-y-2">
              {planned.length === 0 && completed.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Rest day
                </p>
              )}

              {planned.map((workout) => {
                const Icon = sportIcons[workout.sport];
                const matchingActivity = completed.find(c =>
                  isSameDay(new Date(c.date), new Date(workout.date)) &&
                  c.sport === workout.sport
                );
                const isCompleted = !!matchingActivity;
                const session = plannedSessions.find(s => s.id === workout.id);

                return (
                  <div
                    key={workout.id}
                    className={cn(
                      'p-2 rounded-lg border cursor-pointer transition-all hover:ring-1 hover:ring-accent/50',
                      isCompleted
                        ? 'bg-load-fresh/10 border-load-fresh/30'
                        : 'bg-muted/50 border-border'
                    )}
                    onClick={() => onActivityClick?.(workout, matchingActivity || null, session || null)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium truncate">
                        {workout.title}
                      </span>
                      {isCompleted && (
                        <CheckCircle2 className="h-4 w-4 text-load-fresh ml-auto shrink-0" />
                      )}
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
                );
              })}

              {/* Completed without plan */}
              {completed
                .filter(c => !planned.some(p => p.sport === c.sport))
                .map((activity) => {
                  const Icon = sportIcons[activity.sport];
                  return (
                    <div
                      key={activity.id}
                      className="p-2 rounded-lg border bg-accent/10 border-accent/30 cursor-pointer hover:ring-1 hover:ring-accent/50"
                      onClick={() => onActivityClick?.(null, activity)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="h-4 w-4 text-accent" />
                        <span className="text-sm font-medium truncate">
                          {activity.title}
                        </span>
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
        );
      })}
      </div>
    </div>
  );
}
