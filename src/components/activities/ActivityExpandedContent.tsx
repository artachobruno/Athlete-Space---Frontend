import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import {
  Clock, Route, Heart, Zap, Mountain, Bot,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Info, ListChecks, PlayCircle,
  Activity, Thermometer
} from 'lucide-react';
import { ActivityCharts } from './ActivityCharts';
import { ActivityMap } from './ActivityMap';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams, fetchWorkoutExecution, fetchWorkoutCompliance } from '@/lib/api';
import { useStructuredWorkout } from '@/hooks/useStructuredWorkout';
import { useMemo, useRef, useEffect, useState } from 'react';
import { normalizeRoutePointsFromStreams } from '@/lib/route-utils';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';
import {
  CARD_BG,
  CARD_BORDER,
  CARD_INNER_SHADOW,
  CARD_NEBULA,
} from '@/styles/scheduleTheme';

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
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
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
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
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
  
  // Debug logging
  if (workoutId) {
    console.log('[ActivityExpandedContent] Workout state:', {
      workoutId,
      status: structuredWorkoutState.status,
      hasData: !!structuredWorkout,
      stepsCount: structuredWorkout?.steps?.length || 0,
    });
  }
  
  // Check if workout was not found (status = "not_found" in response or workout is null)
  const workoutNotFound = structuredWorkout === null || 
                         (structuredWorkout && 'status' in structuredWorkout && structuredWorkout.status === 'not_found') ||
                         (structuredWorkout && !structuredWorkout.workout);
  
  const { data: execution, isLoading: executionLoading, error: executionError } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId, 'execution'],
    queryFn: () => fetchWorkoutExecution(workoutId!),
    retry: false,
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: complianceData, isLoading: complianceLoading, error: complianceError } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId, 'compliance'],
    queryFn: async () => {
      try {
        return await fetchWorkoutCompliance(workoutId!);
      } catch (error) {
        const apiError = error as { status?: number; message?: string };
        // 404 means compliance not computed yet - this is OK
        if (apiError.status === 404) {
          console.log('[ActivityExpandedContent] Compliance not computed yet for workout', workoutId);
          return null; // Return null instead of throwing
        }
        console.error('[ActivityExpandedContent] Compliance fetch error:', error);
        throw error; // Re-throw other errors
      }
    },
    retry: false,
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
  });
  
  // Debug logging for compliance
  if (workoutId) {
    console.log('[ActivityExpandedContent] Compliance state:', {
      workoutId,
      isLoading: complianceLoading,
      hasData: !!complianceData,
      error: complianceError,
      stepsCount: complianceData?.steps?.length || 0,
    });
  }
  
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
  // Use API compliance data if available, otherwise calculate from duration/distance differences
  const complianceScore = useMemo(() => {
    if (complianceData?.overall_compliance_pct !== undefined) {
      return complianceData.overall_compliance_pct * 100;
    }
    if (!plannedData) return null;
    const diffs = [durationDiff, distanceDiff].filter((d): d is number => d !== undefined);
    if (diffs.length === 0) return null;
    const avgDiff = diffs.reduce((sum, d) => sum + Math.abs(d), 0) / diffs.length;
    return Math.max(0, Math.min(100, 100 - avgDiff));
  }, [complianceData, durationDiff, distanceDiff, plannedData]);

  const getComplianceVerdict = () => {
    if (complianceScore === null) return { label: 'NO PLAN DATA', color: 'text-muted-foreground/50' };
    if (complianceScore >= 95) return { label: 'WITHIN TOLERANCE', color: 'text-load-fresh' };
    if (complianceScore >= 80) return { label: 'MINOR DEVIATION', color: 'text-accent' };
    if (complianceScore >= 60) return { label: 'SIGNIFICANT DEVIATION', color: 'text-load-overreaching' };
    return { label: 'MAJOR DEVIATION', color: 'text-destructive' };
  };

  const verdict = getComplianceVerdict();

  // Parallax scroll effect for stars
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      setScrollY(Math.max(0, Math.min(1, progress)) * 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative px-4 pb-4 pt-0 border-t border-border/50 space-y-4 overflow-hidden rounded-b-xl"
      style={{
        background: CARD_BG,
        borderColor: CARD_BORDER,
        boxShadow: CARD_INNER_SHADOW,
      }}
    >
      {/* Starfield with parallax */}
      <div
        className="absolute inset-0 pointer-events-none rounded-b-xl"
        style={{
          backgroundImage: `url('/stars.svg'), ${CARD_NEBULA}`,
          backgroundSize: 'cover, cover',
          backgroundRepeat: 'no-repeat, no-repeat',
          backgroundPosition: `center ${-scrollY}px, 70% 50%`,
          opacity: 0.35,
          transition: 'background-position 0.1s ease-out',
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between pt-4 pb-2">
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
        <div className="relative p-4 bg-muted/30 rounded-lg border-l-2 border-primary/40 backdrop-blur-sm">
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
      <div className="relative grid grid-cols-2 md:grid-cols-4 gap-3">
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
        {activity.conditionsLabel && (
          <HighlightChip 
            type="neutral" 
            text={`${activity.conditionsLabel} conditions`}
          />
        )}
        {activity.effectiveHeatStressIndex !== undefined && activity.effectiveHeatStressIndex !== null && activity.effectiveHeatStressIndex > 0.5 && (
          <HighlightChip 
            type="warning" 
            text={`Heat stress ${(activity.effectiveHeatStressIndex * 100).toFixed(0)}%`}
          />
        )}
        {activity.coldStressIndex !== undefined && activity.coldStressIndex !== null && activity.coldStressIndex > 0.4 && (
          <HighlightChip 
            type="warning" 
            text={`Cold stress ${(activity.coldStressIndex * 100).toFixed(0)}%`}
          />
        )}
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
        <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4 bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
        
        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Metrics */}
          <div className="space-y-1 bg-muted/30 rounded-lg p-4 border border-border/50 backdrop-blur-sm">
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

          {/* Climate Data Section */}
          {(() => {
            // Check if any climate data exists (not undefined and not null)
            const hasHeatStress = activity.heatStressIndex !== undefined && activity.heatStressIndex !== null;
            const hasEffectiveHeatStress = activity.effectiveHeatStressIndex !== undefined && activity.effectiveHeatStressIndex !== null;
            const hasColdStress = activity.coldStressIndex !== undefined && activity.coldStressIndex !== null;
            const hasConditionsLabel = activity.conditionsLabel !== undefined && activity.conditionsLabel !== null && activity.conditionsLabel !== '';
            const hasClimateData = hasHeatStress || hasEffectiveHeatStress || hasColdStress || hasConditionsLabel;
            
            console.log('[ActivityExpandedContent] Climate data check:', {
              hasHeatStress,
              hasEffectiveHeatStress,
              hasColdStress,
              hasConditionsLabel,
              hasClimateData,
              rawValues: {
                heatStressIndex: activity.heatStressIndex,
                effectiveHeatStressIndex: activity.effectiveHeatStressIndex,
                heatAcclimationScore: activity.heatAcclimationScore,
                coldStressIndex: activity.coldStressIndex,
                windChillC: activity.windChillC,
                avgTemperatureC: activity.avgTemperatureC,
                conditionsLabel: activity.conditionsLabel,
              },
            });
            
            return hasClimateData;
          })() && (
            <div className="relative space-y-1 bg-muted/30 rounded-lg p-4 border border-border/50 backdrop-blur-sm">
              <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Thermometer className="h-4 w-4" />
                Climate Conditions
              </div>
              
              {activity.conditionsLabel && (
                <TelemetryMetricRow
                  label="Conditions"
                  value={activity.conditionsLabel}
                />
              )}

              {activity.effectiveHeatStressIndex !== undefined && activity.effectiveHeatStressIndex !== null ? (
                <TelemetryMetricRow
                  label="Heat Stress"
                  value={`${(activity.effectiveHeatStressIndex * 100).toFixed(0)}%`}
                  delta={activity.heatAcclimationScore !== undefined && activity.heatAcclimationScore !== null && activity.heatAcclimationScore > 0 
                    ? activity.heatAcclimationScore * 100 
                    : undefined}
                  deltaLabel={activity.heatAcclimationScore !== undefined && activity.heatAcclimationScore !== null && activity.heatAcclimationScore > 0
                    ? "acclimated"
                    : undefined}
                />
              ) : activity.heatStressIndex !== undefined && activity.heatStressIndex !== null ? (
                <TelemetryMetricRow
                  label="Heat Stress"
                  value={`${(activity.heatStressIndex * 100).toFixed(0)}%`}
                />
              ) : null}

              {activity.coldStressIndex !== undefined && activity.coldStressIndex !== null && (
                <TelemetryMetricRow
                  label="Cold Stress"
                  value={`${(activity.coldStressIndex * 100).toFixed(0)}%`}
                />
              )}

              {activity.avgTemperatureC !== undefined && activity.avgTemperatureC !== null && (
                <TelemetryMetricRow
                  label="Temperature"
                  value={`${activity.avgTemperatureC.toFixed(1)}°C`}
                />
              )}

              {activity.windAvgMps !== undefined && activity.windAvgMps !== null && (
                <TelemetryMetricRow
                  label="Wind Speed"
                  value={`${(activity.windAvgMps * 3.6).toFixed(1)} km/h`}
                />
              )}

              {activity.windChillC !== undefined && activity.windChillC !== null && (
                <TelemetryMetricRow
                  label="Wind Chill"
                  value={`${activity.windChillC.toFixed(1)}°C`}
                />
              )}
            </div>
          )}
          
          {/* Route Map */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Route
            </div>
            <div className="rounded-lg overflow-hidden border border-border/50 backdrop-blur-sm">
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
          {!workoutId ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No workout linked to this activity</p>
            </div>
          ) : workoutNotFound && !workoutLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Workout not found</p>
            </div>
          ) : workoutLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : workoutError ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Error loading workout: {workoutError}</p>
            </div>
          ) : structuredWorkout && (!structuredWorkout.structured_available || structuredWorkout.steps.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No structured steps available</p>
              <p className="text-xs mt-1 opacity-60">
                {structuredWorkout.workout?.parse_status === 'pending' 
                  ? 'Workout is being parsed...' 
                  : structuredWorkout.workout?.parse_status === 'failed'
                  ? 'Failed to parse workout structure'
                  : 'This workout has no structured steps'}
              </p>
            </div>
          ) : structuredWorkout?.steps && structuredWorkout.steps.length > 0 ? (
            <div className="space-y-2">
              {structuredWorkout.steps.map((step, idx) => {
                // Find compliance data for this step
                const stepCompliance = complianceData?.steps?.find(
                  (sc) => sc.order === step.order || sc.order === idx + 1
                );

                return (
                  <div key={step.id} className="relative p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-medium text-muted-foreground w-6">{step.order || idx + 1}</span>
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
                    {step.target && (
                      <div className="ml-9 mt-1 text-xs text-muted-foreground">
                        {step.target.type === 'pace' && step.target.min && step.target.max && (
                          <span>Target: {step.target.min.toFixed(1)}-{step.target.max.toFixed(1)} {step.target.unit}</span>
                        )}
                        {step.target.type === 'hr' && step.target.min && step.target.max && (
                          <span>Target: {Math.round(step.target.min)}-{Math.round(step.target.max)} {step.target.unit}</span>
                        )}
                        {step.target.type === 'power' && step.target.min && step.target.max && (
                          <span>Target: {Math.round(step.target.min)}-{Math.round(step.target.max)} {step.target.unit}</span>
                        )}
                        {step.target.value && (
                          <span>Target: {step.target.value.toFixed(1)} {step.target.unit}</span>
                        )}
                      </div>
                    )}
                    {/* Step Compliance Metrics */}
                    {stepCompliance && (
                      <div className="mt-2 ml-9 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Compliance:</span>
                          <span className={cn(
                            "font-medium tabular-nums",
                            stepCompliance.compliance_pct >= 0.8 ? "text-load-fresh" :
                            stepCompliance.compliance_pct >= 0.6 ? "text-accent" :
                            "text-load-overreaching"
                          )}>
                            {(stepCompliance.compliance_pct * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          {stepCompliance.time_in_range_seconds > 0 && (
                            <span>In range: {Math.round(stepCompliance.time_in_range_seconds / 60)}m</span>
                          )}
                          {stepCompliance.overshoot_seconds > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                              Over: {Math.round(stepCompliance.overshoot_seconds / 60)}m
                            </span>
                          )}
                          {stepCompliance.undershoot_seconds > 0 && (
                            <span className="text-blue-600 dark:text-blue-400">
                              Under: {Math.round(stepCompliance.undershoot_seconds / 60)}m
                            </span>
                          )}
                          {stepCompliance.pause_seconds > 0 && (
                            <span className="text-muted-foreground/60">
                              Paused: {Math.round(stepCompliance.pause_seconds / 60)}m
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-border/50 backdrop-blur-sm">
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
          {!workoutId ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No workout linked to this activity</p>
            </div>
          ) : workoutNotFound && !workoutLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Workout not found</p>
            </div>
          ) : workoutLoading || complianceLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : workoutError ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Error loading workout: {workoutError}</p>
            </div>
          ) : complianceError && (complianceError as { status?: number }).status === 404 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Compliance data not computed yet</p>
              <p className="text-xs mt-1 opacity-60">Compliance is calculated after workout execution</p>
            </div>
          ) : plannedData ? (
            <div className="space-y-4">
              {/* Verdict Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 backdrop-blur-sm">
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

              {/* Per-Step Compliance Breakdown */}
              {complianceData?.steps && complianceData.steps.length > 0 && (
                <div className="space-y-1 bg-muted/30 rounded-lg p-4 border border-border/50 backdrop-blur-sm">
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Step-by-Step Compliance
                  </div>
                  {complianceData.steps.map((stepComp) => {
                    const step = structuredWorkout?.steps?.find(
                      (s) => s.order === stepComp.order
                    );
                    return (
                      <div key={stepComp.order} className="py-2 border-b border-border/50 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">
                            Step {stepComp.order}: {step?.type || step?.name || 'Unknown'}
                          </span>
                          <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            stepComp.compliance_pct >= 0.8 ? "text-load-fresh" :
                            stepComp.compliance_pct >= 0.6 ? "text-accent" :
                            "text-load-overreaching"
                          )}>
                            {(stepComp.compliance_pct * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-4">
                          <span>In range: {Math.round(stepComp.time_in_range_seconds / 60)}m</span>
                          {stepComp.overshoot_seconds > 0 && (
                            <span className="text-amber-600 dark:text-amber-400">
                              Over: {Math.round(stepComp.overshoot_seconds / 60)}m
                            </span>
                          )}
                          {stepComp.undershoot_seconds > 0 && (
                            <span className="text-blue-600 dark:text-blue-400">
                              Under: {Math.round(stepComp.undershoot_seconds / 60)}m
                            </span>
                          )}
                          {stepComp.pause_seconds > 0 && (
                            <span>Paused: {Math.round(stepComp.pause_seconds / 60)}m</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Overall Compliance Summary */}
              {complianceData && (
                <div className="space-y-1 bg-muted/30 rounded-lg p-4 border border-border/50 backdrop-blur-sm">
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Overall Summary
                  </div>
                  <TelemetryMetricRow
                    label="Overall Compliance"
                    value={`${(complianceData.overall_compliance_pct * 100).toFixed(0)}%`}
                  />
                  <TelemetryMetricRow
                    label="Total Pause Time"
                    value={`${Math.round(complianceData.total_pause_seconds / 60)} min`}
                  />
                  <TelemetryMetricRow
                    label="Status"
                    value={complianceData.completed ? "Completed" : "Incomplete"}
                  />
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
