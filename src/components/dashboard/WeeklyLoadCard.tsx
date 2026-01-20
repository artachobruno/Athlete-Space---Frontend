import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { fetchActivities, fetchTrainingLoad, fetchCalendarWeek } from '@/lib/api';
import { subDays, format, startOfWeek } from 'date-fns';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import { useMemo, useEffect, useState } from 'react';
import { enrichActivitiesWithTss, type TrainingLoadData } from '@/lib/tss-utils';
import type { CompletedActivity } from '@/types';
import type { WeekResponse } from '@/lib/api';

interface WeeklyLoadCardProps {
  activities100?: CompletedActivity[] | null;
  activities100Loading?: boolean;
  trainingLoad7d?: TrainingLoadData | null;
  trainingLoad7dLoading?: boolean;
  weekData?: WeekResponse | null;
  weekDataLoading?: boolean;
  /** Additional CSS classes for the card container */
  className?: string;
}

// SVG Telemetry Trace Component
function LoadTraceSvg({ data, maxLoad }: { data: { day: string; load: number; isToday: boolean }[]; maxLoad: number }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    // Animate once on mount
    const timer = setTimeout(() => setAnimationProgress(1), 50);
    return () => clearTimeout(timer);
  }, []);

  const width = 280;
  const height = 80;
  const padding = { top: 8, right: 4, bottom: 16, left: 4 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // Calculate bar positions and heights
  const barWidth = chartWidth / data.length - 4;
  const effectiveMax = Math.max(maxLoad, 1);
  
  // Build path for load trace line
  const points = data.map((d, i) => {
    const x = padding.left + (i * (chartWidth / data.length)) + barWidth / 2 + 2;
    const barHeight = (d.load / effectiveMax) * chartHeight;
    const y = padding.top + chartHeight - barHeight;
    return { x, y, load: d.load };
  });
  
  // Create smooth bezier path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      pathD += ` Q ${cpx} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`;
      pathD += ` Q ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
  }

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      className="w-full h-full"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Subtle grid pattern */}
        <pattern id="loadGrid" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 20" fill="none" stroke="hsl(215 15% 18%)" strokeWidth="0.5" opacity="0.3" />
        </pattern>
        {/* Intensity gradient for trace */}
        <linearGradient id="loadTraceGradient" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="hsl(215 60% 45%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(175 60% 50%)" stopOpacity="0.8" />
        </linearGradient>
        {/* Glow filter */}
        <filter id="loadGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background grid */}
      <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="url(#loadGrid)" />
      
      {/* Zero baseline */}
      <line 
        x1={padding.left} 
        y1={padding.top + chartHeight} 
        x2={padding.left + chartWidth} 
        y2={padding.top + chartHeight} 
        stroke="hsl(215 15% 22%)" 
        strokeWidth="1" 
      />
      
      {/* Load bars */}
      {data.map((d, i) => {
        const barHeight = (d.load / effectiveMax) * chartHeight;
        const x = padding.left + (i * (chartWidth / data.length)) + 2;
        const y = padding.top + chartHeight - barHeight;
        
        return (
          <g key={i}>
            {/* Bar */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight * animationProgress}
              fill={d.isToday ? 'hsl(175 60% 45%)' : 'hsl(215 15% 24%)'}
              opacity={d.isToday ? 0.9 : 0.6}
              style={{ 
                transition: 'height 0.4s ease-out, y 0.4s ease-out',
                transformOrigin: 'bottom'
              }}
            />
            {/* Day label */}
            <text
              x={x + barWidth / 2}
              y={height - 2}
              textAnchor="middle"
              fill="hsl(215 20% 45%)"
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
              letterSpacing="0.02em"
            >
              {d.day.toUpperCase()}
            </text>
            {/* Load value on hover zone (only if load > 0) */}
            {d.load > 0 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fill={d.isToday ? 'hsl(175 60% 55%)' : 'hsl(215 20% 55%)'}
                fontSize="7"
                fontFamily="JetBrains Mono, monospace"
                opacity={animationProgress}
              >
                {d.load}
              </text>
            )}
          </g>
        );
      })}
      
      {/* Trace line connecting peaks */}
      {points.length > 1 && (
        <path
          d={pathD}
          fill="none"
          stroke="url(#loadTraceGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#loadGlow)"
          opacity={animationProgress * 0.7}
          style={{ transition: 'opacity 0.5s ease-out 0.2s' }}
        />
      )}
      
      {/* Current point marker */}
      {points.length > 0 && data[data.length - 1].load > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r="3"
          fill="hsl(175 60% 50%)"
          filter="url(#loadGlow)"
          opacity={animationProgress}
          style={{ transition: 'opacity 0.5s ease-out 0.3s' }}
        />
      )}
    </svg>
  );
}

export function WeeklyLoadCard(props: WeeklyLoadCardProps = {}) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  // Use props if provided, otherwise fetch (backward compatibility)
  const propsActivities100 = props.activities100;
  const propsActivities100Loading = props.activities100Loading;
  const propsTrainingLoad7d = props.trainingLoad7d;
  const propsTrainingLoad7dLoading = props.trainingLoad7dLoading;
  const propsWeekData = props.weekData;
  const propsWeekDataLoading = props.weekDataLoading;

  // Fetch activities the same way as Calendar and Activities pages
  const { data: activities, isLoading: activitiesLoading } = useAuthenticatedQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    retry: 1,
    enabled: propsActivities100 === undefined,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch training load for TSS enrichment
  const { data: trainingLoadData, isLoading: trainingLoadLoading } = useAuthenticatedQuery<TrainingLoadData>({
    queryKey: ['trainingLoad', 7],
    queryFn: () => {
      console.log('[WeeklyLoadCard] Fetching training load for 7 days');
      return fetchTrainingLoad(7);
    },
    retry: (failureCount, error) => {
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
    enabled: propsTrainingLoad7d === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch calendar week for planned load calculation
  const { data: weekData, isLoading: weekLoading } = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
    enabled: propsWeekData === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Use props if provided, otherwise use fetched data
  const finalActivities = propsActivities100 !== undefined ? propsActivities100 : activities;
  const finalTrainingLoadData = propsTrainingLoad7d !== undefined ? propsTrainingLoad7d : trainingLoadData;
  const finalWeekData = propsWeekData !== undefined ? propsWeekData : weekData;
  
  const isLoading = (propsActivities100Loading !== undefined ? propsActivities100Loading : activitiesLoading) ||
                    (propsTrainingLoad7dLoading !== undefined ? propsTrainingLoad7dLoading : trainingLoadLoading) ||
                    (propsWeekDataLoading !== undefined ? propsWeekDataLoading : weekLoading);

  // Enrich activities with TSS data
  const enrichedActivities = useMemo(() => {
    if (!finalActivities) return [];
    return enrichActivitiesWithTss(finalActivities, finalTrainingLoadData);
  }, [finalActivities, finalTrainingLoadData]);

  // Build chart data for past 7 days from activities
  const weekChartData = useMemo(() => {
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      return {
        day: format(date, 'EEE'),
        date: dateStr,
        load: 0,
        isToday: i === 6,
      };
    });

    // Calculate load from activities for each day
    const activitiesArray = Array.isArray(enrichedActivities) ? enrichedActivities : [];
    chartData.forEach((dayData) => {
      const dayActivities = activitiesArray.filter((activity: CompletedActivity) => {
        if (!activity || !activity.date) return false;
        const activityDate = activity.date.split('T')[0];
        return activityDate === dayData.date;
      });

      const dayLoad = dayActivities.reduce((sum, activity) => {
        const tss = activity.trainingLoad || 0;
        return sum + (typeof tss === 'number' ? tss : 0);
      }, 0);

      dayData.load = Math.round(dayLoad);
    });

    return chartData;
  }, [enrichedActivities, today]);

  // Calculate weekly totals from actual activities data
  const weeklyStats = useMemo(() => {
    let actualLoad = 0;
    let plannedLoad = 0;

    actualLoad = weekChartData.reduce((sum, day) => sum + day.load, 0);

    const sessions = Array.isArray(finalWeekData?.sessions) ? finalWeekData.sessions : [];
    const plannedSessions = sessions.filter(s => s?.status === 'planned' || s?.status === 'completed');
    plannedLoad = plannedSessions.reduce((sum, session) => {
      const durationHours = (session.duration_minutes || 60) / 60;
      return sum + Math.round(durationHours * 50);
    }, 0);

    if (actualLoad > 0 && plannedLoad === 0) {
      plannedLoad = actualLoad;
    }

    const progress = plannedLoad > 0 ? (actualLoad / plannedLoad) * 100 : 0;
    return { actualLoad: Math.round(actualLoad), plannedLoad: Math.round(plannedLoad), progress };
  }, [weekChartData, finalWeekData]);

  const maxLoad = useMemo(() => Math.max(...weekChartData.map(d => d.load), 1), [weekChartData]);

  const cardClassName = props.className;

  if (isLoading) {
    return (
      <F1Card className={cardClassName}>
        <F1CardHeader>
          <F1CardTitle>LOAD (7d)</F1CardTitle>
        </F1CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--f1-text-tertiary))]" />
        </div>
      </F1Card>
    );
  }

  return (
    <F1Card className={cardClassName}>
      <F1CardHeader
        action={
          <span className="f1-metric f1-metric-xs">
            {weeklyStats.actualLoad} <span className="text-[hsl(var(--f1-text-muted))] opacity-50">/</span> {weeklyStats.plannedLoad} <F1CardLabel className="ml-0.5">TSS</F1CardLabel>
          </span>
        }
      >
        <F1CardTitle>LOAD (7d)</F1CardTitle>
      </F1CardHeader>
      
      <div className="space-y-2">
        {/* Progress bar - telemetry band style */}
        <div className="space-y-1">
          <div className="h-[3px] bg-[hsl(215_15%_18%)] overflow-hidden">
            <div
              className="h-full bg-[hsl(175_60%_45%)] transition-all duration-500 ease-out"
              style={{ width: `${Math.min(weeklyStats.progress, 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <F1CardLabel className="tracking-widest">ADHERENCE</F1CardLabel>
            <span className="f1-metric f1-metric-xs">{weeklyStats.progress.toFixed(0)}%</span>
          </div>
        </div>

        {/* SVG Telemetry Trace */}
        <div className="h-24 -mx-1">
          <LoadTraceSvg data={weekChartData} maxLoad={maxLoad} />
        </div>
      </div>
    </F1Card>
  );
}
