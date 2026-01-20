import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import {
  Clock, Route, Heart, Zap, Mountain, Bot,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Info, ListChecks, PlayCircle,
  Activity
} from 'lucide-react';
import { ActivityCharts } from './ActivityCharts';
import { ActivityMap } from './ActivityMap';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams, fetchWorkoutExecution } from '@/lib/api';
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout';
import { useMemo } from 'react';
import { normalizeRoutePointsFromStreams } from '@/lib/route-utils';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';

interface ActivityExpandedContentProps {
  activity: CompletedActivity;
}

// Telemetry sparkline component - thin signal trace
function TelemetrySparkline({ 
  data, 
  color, 
  height = 24,
  showBand = false,
  bandMin = 0,
  bandMax = 100,
}: { 
  data: number[]; 
  color: string; 
  height?: number;
  showBand?: boolean;
  bandMin?: number;
  bandMax?: number;
}) {
  if (!data || data.length < 2) return null;
  
  const width = 120;
  const padding = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="opacity-80">
      {showBand && (
        <rect 
          x={padding} 
          y={height - padding - ((bandMax - min) / range) * (height - padding * 2)}
          width={width - padding * 2}
          height={((bandMax - bandMin) / range) * (height - padding * 2)}
          fill={color}
          opacity="0.1"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Metric row component
function TelemetryMetricRow({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  sparkData,
  sparkColor = 'hsl(var(--accent))',
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  sparkData?: number[];
  sparkColor?: string;
}) {
  const deltaDisplay = delta !== undefined ? (
    <span className={cn(
      'text-xs',
      delta > 0 ? 'text-amber-600 dark:text-amber-400' : delta < 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
    )}>
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  ) : null;

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground w-16">
          {label}
        </span>
        {sparkData && sparkData.length > 2 && (
          <TelemetrySparkline data={sparkData} color={sparkColor} />
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
        {deltaDisplay}
      </div>
    </div>
  );
}

// Compliance deviation indicator
function DeviationIndicator({ 
  planned, 
  actual, 
  label, 
  unit,
  invertDelta = false,
}: { 
  planned: number; 
  actual: number; 
  label: string;
  unit: string;
  invertDelta?: boolean;
}) {
  const diff = planned > 0 ? ((actual - planned) / planned) * 100 : 0;
  const displayDiff = invertDelta ? -diff : diff;
  const isWithinTolerance = Math.abs(diff) <= 5;
  const isOver = diff > 5;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tabular-nums text-foreground">
            {actual.toFixed(unit === 'min' ? 0 : 1)}
          </span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm text-muted-foreground">
          Planned: {planned.toFixed(unit === 'min' ? 0 : 1)}
        </span>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isWithinTolerance ? 'text-green-600 dark:text-green-400' : isOver ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
        )}>
          {isWithinTolerance ? (
            <span>Within tolerance</span>
          ) : (
            <>
              <span>{isOver ? '↑' : '↓'}</span>
              <span>{Math.abs(displayDiff).toFixed(0)}% {isOver ? 'over' : 'under'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityExpandedContent({ activity }: ActivityExpandedContentProps) {
  const { convertDistance, convertElevation } = useUnitSystem();
  
  const workoutId = activity.workout_id;
  
  const structuredWorkoutState = useStructuredWorkout(workoutId);
  const structuredWorkout = structuredWorkoutState.status === 'ready' ? structuredWorkoutState.data : null;
  const workoutLoading = structuredWorkoutState.status === 'loading';
  const workoutError = structuredWorkoutState.status === 'error' ? structuredWorkoutState.error : null;
  
  const { data: execution, isLoading: executionLoading, error: executionError } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId, 'execution'],
    queryFn: () => fetchWorkoutExecution(workoutId!),
    retry: false,
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
  });
  
  const plannedData = useMemo(() => {
    if (!structuredWorkout?.workout) return null;
    const workout = structuredWorkout.workout;
    return {
      duration: workout.total_duration_seconds ? Math.round(workout.total_duration_seconds / 60) : 0,
      distance: workout.total_distance_meters ? workout.total_distance_meters / 1000 : undefined,
    };
  }, [structuredWorkout]);
  
  const { data: streamsData, error: streamsError, isLoading: streamsLoading } = useQuery({
    queryKey: ['activityStreams', activity.id],
    queryFn: () => fetchActivityStreams(activity.id),
    retry: false,
    enabled: !!activity.id,
  });

  const routeCoordinates = useMemo<[number, number][] | undefined>(() => {
    if (streamsError) return undefined;
    const coords = normalizeRoutePointsFromStreams(streamsData);
    return coords.length === 0 ? undefined : coords;
  }, [streamsData, streamsError]);
  
  const durationDiff = plannedData && plannedData.duration > 0
    ? ((activity.duration - plannedData.duration) / plannedData.duration) * 100
    : undefined;
  
  const distanceDiff = plannedData && plannedData.distance && plannedData.distance > 0
    ? ((activity.distance - plannedData.distance) / plannedData.distance) * 100
    : undefined;
  
  const distanceDisplay = convertDistance(activity.distance);
  const plannedDistanceDisplay = plannedData?.distance
    ? convertDistance(plannedData.distance)
    : null;
  const elevationDisplay = activity.elevation ? convertElevation(activity.elevation) : null;

  // Generate sparkline data from streams
  const hrSparkData = useMemo(() => {
    if (!streamsData?.heartrate) return undefined;
    const hr = streamsData.heartrate.filter((v): v is number => typeof v === 'number');
    if (hr.length < 10) return undefined;
    // Downsample to ~30 points
    const step = Math.max(1, Math.floor(hr.length / 30));
    return hr.filter((_, i) => i % step === 0);
  }, [streamsData]);

  const paceSparkData = useMemo(() => {
    if (!streamsData?.pace) return undefined;
    const pace = streamsData.pace.filter((v): v is number => typeof v === 'number' && v > 0);
    if (pace.length < 10) return undefined;
    const step = Math.max(1, Math.floor(pace.length / 30));
    return pace.filter((_, i) => i % step === 0);
  }, [streamsData]);

  const elevSparkData = useMemo(() => {
    if (!streamsData?.elevation) return undefined;
    const elev = streamsData.elevation.filter((v): v is number => typeof v === 'number');
    if (elev.length < 10) return undefined;
    const step = Math.max(1, Math.floor(elev.length / 30));
    return elev.filter((_, i) => i % step === 0);
  }, [streamsData]);

  // Compliance score calculation
  const complianceScore = useMemo(() => {
    if (!plannedData) return null;
    const diffs = [durationDiff, distanceDiff].filter((d): d is number => d !== undefined);
    if (diffs.length === 0) return null;
    const avgDiff = diffs.reduce((sum, d) => sum + Math.abs(d), 0) / diffs.length;
    return Math.max(0, Math.min(100, 100 - avgDiff));
  }, [durationDiff, distanceDiff, plannedData]);

  const getComplianceVerdict = () => {
    if (complianceScore === null) return { label: 'NO PLAN DATA', color: 'text-muted-foreground/50' };
    if (complianceScore >= 95) return { label: 'WITHIN TOLERANCE', color: 'text-load-fresh' };
    if (complianceScore >= 80) return { label: 'MINOR DEVIATION', color: 'text-accent' };
    if (complianceScore >= 60) return { label: 'SIGNIFICANT DEVIATION', color: 'text-load-overreaching' };
    return { label: 'MAJOR DEVIATION', color: 'text-destructive' };
  };

  const verdict = getComplianceVerdict();

  return (
    <div className="px-4 pb-4 pt-0 border-t border-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            Session Details
          </span>
        </div>
        <div className={cn('text-sm font-medium', verdict.color)}>
          {verdict.label}
        </div>
      </div>

      {/* Coach Insight */}
      {activity.coachFeedback && (
        <div className="p-4 bg-muted/50 rounded-lg border-l-2 border-primary/40">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Analysis</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {activity.coachFeedback}
          </p>
        </div>
      )}

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TelemetryMetricCard
          label="Distance"
          value={distanceDisplay.value.toFixed(1)}
          unit={distanceDisplay.unit}
          delta={distanceDiff}
        />
        <TelemetryMetricCard
          label="Time"
          value={activity.duration.toString()}
          unit="min"
          delta={durationDiff}
        />
        {activity.trainingLoad > 0 && (
          <TelemetryMetricCard
            label="TSS"
            value={Math.round(activity.trainingLoad).toString()}
          />
        )}
        {elevationDisplay && (
          <TelemetryMetricCard
            label="Elevation"
            value={elevationDisplay.value.toFixed(0)}
            unit={elevationDisplay.unit}
          />
        )}
      </div>

      {/* Key Highlights */}
      <div className="flex flex-wrap gap-2">
        <HighlightChip type="positive" text="HR in zone 85%" />
        <HighlightChip type="positive" text="Negative split" />
        {durationDiff && durationDiff > 10 && (
          <HighlightChip type="warning" text="Over duration" />
        )}
        {distanceDiff && distanceDiff > 10 && (
          <HighlightChip type="warning" text="Over distance" />
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Metrics */}
          <div className="space-y-1 bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Performance Metrics
            </div>
            
            {activity.avgHeartRate && (
              <TelemetryMetricRow
                label="HR"
                value={activity.avgHeartRate}
                unit="bpm"
                sparkData={hrSparkData}
                sparkColor="hsl(var(--chart-4))"
              />
            )}
            
            {activity.avgPower && (
              <TelemetryMetricRow
                label="Power"
                value={activity.avgPower}
                unit="W"
              />
            )}
            
            {paceSparkData && (
              <TelemetryMetricRow
                label="Pace"
                value={(() => {
                  const avgPace = paceSparkData.reduce((a, b) => a + b, 0) / paceSparkData.length;
                  const mins = Math.floor(avgPace);
                  const secs = Math.round((avgPace - mins) * 60);
                  return `${mins}:${secs.toString().padStart(2, '0')}`;
                })()}
                unit="/km"
                sparkData={paceSparkData}
                sparkColor="hsl(var(--chart-1))"
              />
            )}
            
            {elevSparkData && (
              <TelemetryMetricRow
                label="Elev"
                value={Math.round(Math.max(...elevSparkData) - Math.min(...elevSparkData))}
                unit="m gain"
                sparkData={elevSparkData}
                sparkColor="hsl(var(--chart-2))"
              />
            )}
          </div>
          
          {/* Route Map */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Route
            </div>
            <div className="rounded-lg overflow-hidden border border-border">
              {streamsLoading ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : streamsError ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  <span className="text-sm">Route unavailable</span>
                </div>
              ) : (
                <ActivityMap coordinates={routeCoordinates} />
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* STEPS TAB */}
        <TabsContent value="steps" className="mt-4">
          {workoutLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : workoutError ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Error loading workout</p>
            </div>
          ) : structuredWorkout?.steps && structuredWorkout.steps.length > 0 ? (
            <div className="space-y-2">
              {structuredWorkout.steps.map((step, idx) => (
                <div key={step.id} className="p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-muted-foreground w-6">{idx + 1}</span>
                    <span className="text-sm font-semibold text-foreground capitalize">{step.type}</span>
                    {step.duration_seconds && (
                      <span className="text-sm text-muted-foreground ml-auto tabular-nums">
                        {Math.round(step.duration_seconds / 60)} min
                      </span>
                    )}
                  </div>
                  {step.purpose && (
                    <p className="text-sm text-foreground ml-9">{step.purpose}</p>
                  )}
                  {step.intensity && (
                    <p className="text-sm text-muted-foreground ml-9 mt-1">{step.intensity}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No structured steps</p>
            </div>
          )}
        </TabsContent>
        
        {/* EXECUTION TAB */}
        <TabsContent value="execution" className="mt-4 space-y-4">
          <div className="text-sm font-medium text-muted-foreground mb-3">
            Time-Series Analysis
          </div>
          <ActivityCharts activity={activity} />
          
          {/* Execution Metrics Summary */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <div className={cn(
                "text-base font-medium",
                (execution?.completed ?? true) ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
              )}>
                {(execution?.completed ?? true) ? "Completed" : "Incomplete"}
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="text-sm text-muted-foreground mb-1">Date</div>
              <div className="text-base text-foreground">
                {execution?.executionDate || activity.date}
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* COMPLIANCE TAB */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          {workoutLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : plannedData ? (
            <div className="space-y-4">
              {/* Verdict Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Execution Assessment
                  </div>
                  <div className={cn('text-lg font-semibold mt-1', verdict.color)}>
                    {verdict.label}
                  </div>
                </div>
                {complianceScore !== null && (
                  <div className="text-right">
                    <div className="text-3xl font-bold tabular-nums text-foreground">
                      {complianceScore.toFixed(0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Score
                    </div>
                  </div>
                )}
              </div>

              {/* Deviations */}
              <div className="space-y-1 bg-muted/30 rounded-lg p-4 border border-border">
                <div className="text-sm font-medium text-muted-foreground mb-3">
                  Plan vs Executed
                </div>
                
                {plannedData.duration > 0 && (
                  <DeviationIndicator
                    planned={plannedData.duration}
                    actual={activity.duration}
                    label="Duration"
                    unit="min"
                  />
                )}
                
                {plannedData.distance && plannedData.distance > 0 && (
                  <DeviationIndicator
                    planned={plannedDistanceDisplay?.value ?? plannedData.distance}
                    actual={distanceDisplay.value}
                    label="Distance"
                    unit={distanceDisplay.unit}
                  />
                )}
              </div>

              {/* Compliance from API */}
              {structuredWorkout?.comparison && (
                <div className="space-y-1 bg-muted/30 rounded-lg p-4 border border-border">
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Detailed Compliance
                  </div>
                  {(() => {
                    const comp = Array.isArray(structuredWorkout.comparison) 
                      ? structuredWorkout.comparison[0] 
                      : structuredWorkout.comparison;
                    const summary = (comp as { summary_json?: Record<string, number | boolean> })?.summary_json;
                    
                    if (!summary) return null;
                    
                    return Object.entries(summary).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : String(value)}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No plan data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card
function TelemetryMetricCard({
  label,
  value,
  unit,
  delta,
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
}) {
  return (
    <div className="p-3 bg-muted/30 rounded-lg border border-border">
      <div className="text-sm text-muted-foreground mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      {delta !== undefined && (
        <div className={cn(
          'text-sm mt-1',
          delta > 5 ? 'text-amber-600 dark:text-amber-400' : delta < -5 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
        )}>
          {delta > 0 ? '+' : ''}{delta.toFixed(0)}%
        </div>
      )}
    </div>
  );
}

function HighlightChip({ type, text }: { type: 'positive' | 'warning' | 'neutral'; text: string }) {
  const colors = {
    positive: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={cn(
      'px-2.5 py-1 rounded-md border text-xs font-medium',
      colors[type]
    )}>
      {text}
    </span>
  );
}
