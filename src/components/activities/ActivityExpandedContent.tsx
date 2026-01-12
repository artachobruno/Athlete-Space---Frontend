import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import {
  Clock, Route, Heart, Zap, Mountain, Bot,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Info
} from 'lucide-react';
import { ActivityCharts } from './ActivityCharts';
import { ActivityMap } from './ActivityMap';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams, fetchCalendarWeek } from '@/lib/api';
import { useMemo } from 'react';
import { normalizeRoutePointsFromStreams } from '@/lib/route-utils';
import { matchActivityToSession } from '@/lib/session-utils';
import { startOfWeek, format } from 'date-fns';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

interface ActivityExpandedContentProps {
  activity: CompletedActivity;
}

export function ActivityExpandedContent({ activity }: ActivityExpandedContentProps) {
  const { convertDistance, convertElevation } = useUnitSystem();
  
  // Get the week start date for the activity's date
  const activityDate = useMemo(() => {
    return activity.date ? new Date(activity.date) : new Date();
  }, [activity.date]);
  
  const weekStart = useMemo(() => {
    return startOfWeek(activityDate, { weekStartsOn: 1 });
  }, [activityDate]);
  
  const weekStartStr = useMemo(() => {
    return format(weekStart, 'yyyy-MM-dd');
  }, [weekStart]);
  
  // Fetch calendar week data to find planned sessions
  const { data: weekData } = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => fetchCalendarWeek(weekStartStr),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Find the matching planned session for this activity
  const plannedSession = useMemo(() => {
    if (!weekData?.sessions || !Array.isArray(weekData.sessions)) {
      return null;
    }
    
    const sessionId = matchActivityToSession(activity, weekData.sessions, 0);
    if (!sessionId) {
      return null;
    }
    
    return weekData.sessions.find(s => s.id === sessionId) || null;
  }, [activity, weekData]);
  
  // Extract planned data from the matched session
  const plannedData = useMemo(() => {
    if (!plannedSession) {
      return null;
    }
    
    return {
      duration: plannedSession.duration_minutes || 0,
      distance: plannedSession.distance_km || undefined,
      // Note: Heart rate and power are not typically in planned sessions
      // These would need to come from workout structure or be estimated
      avgHeartRate: undefined,
      avgPower: undefined,
    };
  }, [plannedSession]);
  
  // Fetch activity streams for route data
  // Note: retry is set to false to avoid retrying on CORS errors
  const { data: streamsData, error: streamsError, isLoading: streamsLoading } = useQuery({
    queryKey: ['activityStreams', activity.id],
    queryFn: () => fetchActivityStreams(activity.id),
    retry: false, // Don't retry - CORS errors won't resolve with retries
    enabled: !!activity.id,
  });

  // Extract route coordinates from streams using normalization utility
  const routeCoordinates = useMemo<[number, number][] | undefined>(() => {
    // Debug logging
    if (streamsData) {
      console.log('[ActivityExpandedContent] Streams data received:', {
        hasRoutePoints: !!streamsData.route_points,
        routePointsType: Array.isArray(streamsData.route_points) ? 'array' : typeof streamsData.route_points,
        routePointsLength: Array.isArray(streamsData.route_points) ? streamsData.route_points.length : 0,
      });
    }
    
    if (streamsError) {
      console.warn('[ActivityExpandedContent] Streams error:', streamsError);
    }
    
    // Use normalization utility to handle all route point formats
    const coords = normalizeRoutePointsFromStreams(streamsData);
    
    console.debug('[ActivityExpandedContent] Normalized coordinates:', coords.length, 'points');
    
    // Return undefined if no valid coordinates found
    if (coords.length === 0) {
      console.log('[ActivityExpandedContent] No valid route points after normalization');
      return undefined;
    }
    
    return coords;
  }, [streamsData, streamsError]);
  
  // Calculate comparison only if we have planned data
  const durationDiff = plannedData && plannedData.duration > 0
    ? ((activity.duration - plannedData.duration) / plannedData.duration) * 100
    : undefined;
  
  const distanceDiff = plannedData && plannedData.distance && plannedData.distance > 0
    ? ((activity.distance - plannedData.distance) / plannedData.distance) * 100
    : undefined;
  
  // Note: Heart rate and power comparisons are not available from planned sessions
  // These would need to come from workout structure or intensity targets
  const hrDiff = undefined;
  
  const distanceDisplay = convertDistance(activity.distance);
  const plannedDistanceDisplay = plannedData?.distance
    ? convertDistance(plannedData.distance)
    : null;
  const elevationDisplay = activity.elevation ? convertElevation(activity.elevation) : null;

  const getComplianceStatus = () => {
    // Only calculate compliance if we have planned data
    if (!plannedData) {
      return { label: 'No plan available', color: 'text-muted-foreground', icon: Minus };
    }
    
    const diffs = [durationDiff, distanceDiff].filter((d): d is number => d !== undefined);
    if (diffs.length === 0) {
      return { label: 'Close to target', color: 'text-muted-foreground', icon: Minus };
    }
    
    const avgDiff = diffs.reduce((sum, d) => sum + Math.abs(d), 0) / diffs.length;
    if (avgDiff < 15) return { label: 'On Target', color: 'text-load-fresh', icon: CheckCircle2 };
    if (durationDiff && durationDiff > 10) return { label: 'Longer than planned', color: 'text-load-overreaching', icon: TrendingUp };
    if (durationDiff && durationDiff < -10) return { label: 'Shorter than planned', color: 'text-load-optimal', icon: TrendingDown };
    return { label: 'Close to target', color: 'text-muted-foreground', icon: Minus };
  };

  const compliance = getComplianceStatus();
  const ComplianceIcon = compliance.icon;

  return (
    <div className="px-4 pb-4 pt-0 border-t border-border space-y-5">
      {/* Compliance Badge */}
      <div className={cn('flex items-center gap-2 pt-4', compliance.color)}>
        <ComplianceIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{compliance.label}</span>
      </div>

      {/* Coach Insight - Primary Visual */}
      {activity.coachFeedback && (
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-5 w-5 text-accent" />
            <span className="text-sm font-semibold text-accent">Coach Analysis</span>
          </div>
          <p className="text-foreground leading-relaxed">
            {activity.coachFeedback}
          </p>
        </div>
      )}

      {/* Core Metrics Grid - Order: Distance, Duration, TSS, NP/Effort, IF */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          icon={Route}
          label="Distance"
          value={`${distanceDisplay.value.toFixed(1)} ${distanceDisplay.unit}`}
          diff={distanceDiff}
          planned={plannedDistanceDisplay ? `${plannedDistanceDisplay.value.toFixed(1)} ${plannedDistanceDisplay.unit}` : undefined}
        />
        <MetricCard
          icon={Clock}
          label="Duration"
          value={`${activity.duration} min`}
          diff={durationDiff}
          planned={plannedData?.duration ? `${plannedData.duration} min` : undefined}
        />
        {activity.trainingLoad > 0 && (
          <MetricCard
            icon={Zap}
            label="TSS"
            value={`${Math.round(activity.trainingLoad)}`}
          />
        )}
        {/* Normalized Power / Effort - only for bike and run */}
        {activity.normalizedPower !== undefined && activity.normalizedPower !== null && 
         (activity.sport === 'cycling' || activity.sport === 'running') && (
          <MetricCardWithTooltip
            icon={Zap}
            label={activity.sport === 'cycling' ? 'Normalized Power' : 'Normalized Effort'}
            value={activity.sport === 'cycling' 
              ? `${Math.round(activity.normalizedPower)} W`
              : activity.normalizedPower.toFixed(2)}
            tooltip={activity.sport === 'cycling' 
              ? 'Normalized Power (NP)\nAccounts for variability in effort.\nMore accurate than average power.'
              : 'Normalized Effort\nAdjusts for pace variability to reflect true effort.'}
            effortSource={activity.effortSource}
          />
        )}
        {/* Intensity Factor - only for bike and run */}
        {(activity.sport === 'cycling' || activity.sport === 'running') && (
          activity.intensityFactor !== undefined && activity.intensityFactor !== null ? (
            <MetricCardWithTooltip
              icon={TrendingUp}
              label="Intensity Factor"
              value={activity.intensityFactor.toFixed(2)}
              tooltip="Intensity Factor (IF)\nCompares session effort to your threshold.\nIF = 1.00 ≈ threshold effort\nIF < 0.75 = easy\nIF > 1.05 = hard"
              intensityFactor={activity.intensityFactor}
              effortSource={activity.effortSource}
            />
          ) : (
            <MetricCardWithTooltip
              icon={TrendingUp}
              label="Intensity Factor"
              value="—"
              tooltip="Set your threshold to enable IF"
              intensityFactor={undefined}
              effortSource={activity.effortSource}
            />
          )
        )}
        {activity.avgHeartRate && (
          <MetricCard
            icon={Heart}
            label="Avg HR"
            value={`${activity.avgHeartRate} bpm`}
          />
        )}
        {activity.avgPower && (
          <MetricCard
            icon={Zap}
            label="Avg Power"
            value={`${activity.avgPower} W`}
          />
        )}
        {elevationDisplay && (
          <MetricCard
            icon={Mountain}
            label="Elevation"
            value={`${elevationDisplay.value.toFixed(1)} ${elevationDisplay.unit}`}
          />
        )}
      </div>
      
      {/* Effort Source Label */}
      {activity.effortSource && (
        <div className="text-xs text-muted-foreground">
          Effort source: {activity.effortSource === 'power' ? 'Power' : 
                          activity.effortSource === 'pace' ? 'Pace-derived' : 
                          'Heart rate (fallback)'}
        </div>
      )}

      {/* Key Highlights */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Key Highlights</h4>
        <div className="flex flex-wrap gap-2">
          <HighlightChip
            type="positive"
            text="HR in target zone 85%"
          />
          <HighlightChip
            type="positive"
            text="Negative split"
          />
          {durationDiff && durationDiff > 10 && (
            <HighlightChip
              type="warning"
              text="Longer than planned"
            />
          )}
          {distanceDiff && distanceDiff > 10 && (
            <HighlightChip
              type="warning"
              text="Further than planned"
            />
          )}
        </div>
      </div>

      {/* Tabs for Charts and Map */}
      <Tabs defaultValue="charts" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="charts">Performance Data</TabsTrigger>
          <TabsTrigger value="map">Route Map</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="mt-4">
          <ActivityCharts activity={activity} />
        </TabsContent>
        <TabsContent value="map" className="mt-4">
          {streamsLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-sm">Loading route data...</p>
              </div>
            </div>
          ) : streamsError ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <p className="text-sm font-medium mb-1">Unable to load route map</p>
                <p className="text-xs">
                  {streamsError instanceof Error ? streamsError.message : 'Failed to fetch route data'}
                </p>
              </div>
            </div>
          ) : (
            <ActivityMap coordinates={routeCoordinates} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  diff,
  planned,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  diff?: number;
  planned?: string;
}) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        <span className="text-xs">{label}</span>
      </div>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      {planned && (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">Plan: {planned}</span>
          {diff !== undefined && (
            <span className={cn(
              'text-xs font-medium',
              diff > 5 ? 'text-load-overreaching' : diff < -5 ? 'text-load-optimal' : 'text-muted-foreground'
            )}>
              ({diff > 0 ? '+' : ''}{diff.toFixed(0)}%)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCardWithTooltip({
  icon: Icon,
  label,
  value,
  tooltip,
  intensityFactor,
  effortSource,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  tooltip: string;
  intensityFactor?: number;
  effortSource?: 'power' | 'pace' | 'hr';
}) {
  const isGreyedOut = effortSource === 'hr' && intensityFactor !== undefined;
  const isHighlighted = intensityFactor !== undefined && intensityFactor >= 1.0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "p-3 bg-muted/50 rounded-lg cursor-help",
            isGreyedOut && "opacity-60",
            isHighlighted && "ring-2 ring-load-overreaching/30"
          )}>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon className="h-4 w-4" />
              <span className="text-xs">{label}</span>
              <Info className="h-3 w-3 text-muted-foreground/60" />
            </div>
            <div className={cn(
              "text-lg font-semibold",
              isHighlighted ? "text-load-overreaching" : "text-foreground"
            )}>
              {value}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="whitespace-pre-line text-sm">{tooltip}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HighlightChip({ type, text }: { type: 'positive' | 'warning' | 'neutral'; text: string }) {
  const colors = {
    positive: 'bg-load-fresh/10 border-load-fresh/30 text-load-fresh',
    warning: 'bg-load-overreaching/10 border-load-overreaching/30 text-load-overreaching',
    neutral: 'bg-muted border-border text-muted-foreground',
  };

  return (
    <span className={cn('px-2.5 py-1 rounded-full border text-xs font-medium', colors[type])}>
      {text}
    </span>
  );
}
