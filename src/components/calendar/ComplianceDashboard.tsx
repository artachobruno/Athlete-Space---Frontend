import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { fetchCalendarSeason, fetchCalendarWeek, type CalendarSession } from '@/lib/api';
import { startOfWeek, format, isWithinInterval, endOfWeek, isBefore, startOfDay, parseISO } from 'date-fns';
import { CheckCircle2, Clock, TrendingUp, AlertCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComplianceStats {
  totalPlanned: number;
  totalCompleted: number;
  totalSkipped: number;
  totalCancelled: number;
  complianceRate: number;
  weeklyCompliance: number;
  missedSessions: number;
}

interface ComplianceDashboardProps {
  currentDate?: Date;
  showWeekly?: boolean;
  showSeason?: boolean;
}

export function ComplianceDashboard({ 
  currentDate = new Date(), 
  showWeekly = true,
  showSeason = true 
}: ComplianceDashboardProps) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const { data: weekData } = useQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
  });

  const { data: seasonData } = useQuery({
    queryKey: ['calendarSeason'],
    queryFn: () => fetchCalendarSeason(),
    retry: 1,
    enabled: showSeason,
  });

  const weeklyStats = useMemo<ComplianceStats | null>(() => {
    const sessions = Array.isArray(weekData?.sessions) ? weekData.sessions as CalendarSession[] : [];
    if (sessions.length === 0) return null;

    const todayStart = startOfDay(currentDate);
    
    // Filter sessions up to previous day (exclude today)
    const sessionsUpToPreviousDay = sessions.filter(s => {
      if (!s?.date) return false;
      const sessionDate = parseISO(s.date);
      return isBefore(sessionDate, todayStart);
    });

    // Count planned sessions up to previous day
    const planned = sessionsUpToPreviousDay.filter(s => s?.status === 'planned' || s?.status === 'completed');
    // Count completed sessions up to previous day
    const completed = sessionsUpToPreviousDay.filter(s => s?.status === 'completed');
    // Count skipped and cancelled from all sessions (for display purposes)
    const skipped = sessions.filter(s => s?.status === 'skipped');
    const cancelled = sessions.filter(s => s?.status === 'cancelled');

    const complianceRate = planned.length > 0 
      ? Math.round((completed.length / planned.length) * 100)
      : 0;

    return {
      totalPlanned: planned.length,
      totalCompleted: completed.length,
      totalSkipped: skipped.length,
      totalCancelled: cancelled.length,
      complianceRate,
      weeklyCompliance: complianceRate,
      missedSessions: planned.length - completed.length,
    };
  }, [weekData, currentDate]);

  const seasonStats = useMemo<ComplianceStats | null>(() => {
    const sessions = Array.isArray(seasonData?.sessions) ? seasonData.sessions as CalendarSession[] : [];
    if (sessions.length === 0) return null;

    const todayStart = startOfDay(currentDate);
    
    // Filter sessions up to previous day (exclude today)
    const sessionsUpToPreviousDay = sessions.filter(s => {
      if (!s?.date) return false;
      const sessionDate = parseISO(s.date);
      return isBefore(sessionDate, todayStart);
    });

    // Count planned sessions up to previous day
    const planned = sessionsUpToPreviousDay.filter(s => s?.status === 'planned' || s?.status === 'completed');
    // Count completed sessions up to previous day
    const completed = sessionsUpToPreviousDay.filter(s => s?.status === 'completed');
    // Count skipped and cancelled from all sessions (for display purposes)
    const skipped = sessions.filter(s => s?.status === 'skipped');
    const cancelled = sessions.filter(s => s?.status === 'cancelled');

    const complianceRate = planned.length > 0 
      ? Math.round((completed.length / planned.length) * 100)
      : 0;

    return {
      totalPlanned: planned.length,
      totalCompleted: completed.length,
      totalSkipped: skipped.length,
      totalCancelled: cancelled.length,
      complianceRate,
      weeklyCompliance: 0, // Not applicable for season view
      missedSessions: planned.length - completed.length,
    };
  }, [seasonData, currentDate]);

  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-load-fresh';
    if (rate >= 60) return 'text-load-optimal';
    if (rate >= 40) return 'text-muted-foreground';
    return 'text-load-overreaching';
  };

  const getComplianceBadge = (rate: number) => {
    if (rate >= 80) return { label: 'Excellent', variant: 'default' as const };
    if (rate >= 60) return { label: 'Good', variant: 'default' as const };
    if (rate >= 40) return { label: 'Fair', variant: 'secondary' as const };
    return { label: 'Needs Improvement', variant: 'destructive' as const };
  };

  if (!weeklyStats && !seasonStats) {
    return (
      <GlassCard>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground text-sm">
            No compliance data available
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {showWeekly && weeklyStats && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weekly Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main compliance rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion Rate</span>
                <div className="flex items-center gap-2">
                  <span className={cn('text-2xl font-bold', getComplianceColor(weeklyStats.complianceRate))}>
                    {weeklyStats.complianceRate}%
                  </span>
                  <Badge variant={getComplianceBadge(weeklyStats.complianceRate).variant}>
                    {getComplianceBadge(weeklyStats.complianceRate).label}
                  </Badge>
                </div>
              </div>
              <Progress value={weeklyStats.complianceRate} className="h-2" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Planned</div>
                <div className="text-lg font-semibold">{weeklyStats.totalPlanned}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-load-fresh" />
                  Completed
                </div>
                <div className="text-lg font-semibold text-load-fresh">
                  {weeklyStats.totalCompleted}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  Skipped
                </div>
                <div className="text-lg font-semibold">{weeklyStats.totalSkipped}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-load-overreaching" />
                  Missed
                </div>
                <div className="text-lg font-semibold text-load-overreaching">
                  {weeklyStats.missedSessions}
                </div>
              </div>
            </div>
          </CardContent>
        </GlassCard>
      )}

      {showSeason && seasonStats && (
        <GlassCard>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Season Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main compliance rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Completion Rate</span>
                <div className="flex items-center gap-2">
                  <span className={cn('text-2xl font-bold', getComplianceColor(seasonStats.complianceRate))}>
                    {seasonStats.complianceRate}%
                  </span>
                  <Badge variant={getComplianceBadge(seasonStats.complianceRate).variant}>
                    {getComplianceBadge(seasonStats.complianceRate).label}
                  </Badge>
                </div>
              </div>
              <Progress value={seasonStats.complianceRate} className="h-2" />
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Total Planned</div>
                <div className="text-lg font-semibold">{seasonStats.totalPlanned}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-load-fresh" />
                  Completed
                </div>
                <div className="text-lg font-semibold text-load-fresh">
                  {seasonStats.totalCompleted}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  Skipped
                </div>
                <div className="text-lg font-semibold">{seasonStats.totalSkipped}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-load-overreaching" />
                  Missed
                </div>
                <div className="text-lg font-semibold text-load-overreaching">
                  {seasonStats.missedSessions}
                </div>
              </div>
            </div>

            {/* Additional season info */}
            {seasonData && (
              <div className="pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground">
                  Season: {format(new Date(seasonData.season_start), 'MMM d')} - {format(new Date(seasonData.season_end), 'MMM d, yyyy')}
                </div>
              </div>
            )}
          </CardContent>
        </GlassCard>
      )}
    </div>
  );
}

