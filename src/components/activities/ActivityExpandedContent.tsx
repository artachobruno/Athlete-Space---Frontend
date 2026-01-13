import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import {
  Clock, Route, Heart, Zap, Mountain, Bot,
  TrendingUp, TrendingDown, Minus, CheckCircle2, Info, ListChecks, PlayCircle
} from 'lucide-react';
import { ActivityCharts } from './ActivityCharts';
import { ActivityMap } from './ActivityMap';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { useQuery } from '@tanstack/react-query';
import { fetchActivityStreams, fetchWorkout, fetchWorkoutExecution, fetchWorkoutCompliance } from '@/lib/api';
import { useMemo } from 'react';
import { normalizeRoutePointsFromStreams } from '@/lib/route-utils';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { Loader2 } from 'lucide-react';

interface ActivityExpandedContentProps {
  activity: CompletedActivity;
}

export function ActivityExpandedContent({ activity }: ActivityExpandedContentProps) {
  const { convertDistance, convertElevation } = useUnitSystem();
  
  // PHASE F1: Assume activity.workout_id always exists (frontend invariant)
  // PHASE F2: Always fetch workout data for Activities page
  const workoutId = activity.workout_id;
  
  // Fetch workout data
  const { data: workout, isLoading: workoutLoading } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId],
    queryFn: () => fetchWorkout(workoutId!),
    retry: 1,
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch workout execution data
  const { data: execution, isLoading: executionLoading } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId, 'execution'],
    queryFn: () => fetchWorkoutExecution(workoutId!),
    retry: 1,
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch workout compliance data
  const { data: compliance, isLoading: complianceLoading } = useAuthenticatedQuery({
    queryKey: ['workout', workoutId, 'compliance'],
    queryFn: () => fetchWorkoutCompliance(workoutId!),
    retry: 1,
    enabled: !!workoutId,
    staleTime: 5 * 60 * 1000,
  });
  
  // Extract planned data from workout
  const plannedData = useMemo(() => {
    if (!workout) {
      return null;
    }
    
    return {
      duration: workout.duration || 0,
      distance: workout.distance,
    };
  }, [workout]);
  
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

  const complianceStatus = getComplianceStatus();
  const ComplianceIcon = complianceStatus.icon;

  return (
    <div className="px-4 pb-4 pt-0 border-t border-border space-y-5">
      {/* Compliance Badge */}
      <div className={cn('flex items-center gap-2 pt-4', complianceStatus.color)}>
        <ComplianceIcon className="h-4 w-4" />
        <span className="text-sm font-medium">{complianceStatus.label}</span>
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

      {/* PHASE F2: Tabs for Overview, Steps, Execution, Compliance */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Steps</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Performance Charts */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Performance Data</h4>
            <ActivityCharts activity={activity} />
          </div>
          
          {/* Route Map */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Route Map</h4>
            {streamsLoading ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
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
          </div>
        </TabsContent>
        
        <TabsContent value="steps" className="mt-4">
          {workoutLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : workout?.structure && workout.structure.length > 0 ? (
            <div className="space-y-3">
              {workout.structure.map((step, idx) => (
                <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-foreground capitalize">{step.type}</span>
                    {step.duration && (
                      <span className="text-xs text-muted-foreground">{step.duration} min</span>
                    )}
                    {step.distance && (
                      <span className="text-xs text-muted-foreground">
                        {convertDistance(step.distance).value.toFixed(1)} {convertDistance(step.distance).unit}
                      </span>
                    )}
                  </div>
                  {step.intensity && (
                    <p className="text-sm text-muted-foreground">{step.intensity}</p>
                  )}
                  {step.notes && (
                    <p className="text-sm text-foreground mt-2">{step.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No workout structure available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="execution" className="mt-4">
          {executionLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : execution ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <PlayCircle className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">Execution Status</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className={cn(
                      "text-sm font-medium",
                      execution.completed ? "text-load-fresh" : "text-muted-foreground"
                    )}>
                      {execution.completed ? "Yes" : "No"}
                    </span>
                  </div>
                  {execution.executionDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Execution Date</span>
                      <span className="text-sm text-foreground">{execution.executionDate}</span>
                    </div>
                  )}
                  {execution.metrics && (
                    <div className="mt-4 space-y-2 pt-4 border-t border-border">
                      <h5 className="text-sm font-semibold text-foreground">Metrics</h5>
                      {execution.metrics.duration && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Duration</span>
                          <span className="text-sm text-foreground">{execution.metrics.duration} min</span>
                        </div>
                      )}
                      {execution.metrics.distance && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Distance</span>
                          <span className="text-sm text-foreground">
                            {convertDistance(execution.metrics.distance).value.toFixed(1)} {convertDistance(execution.metrics.distance).unit}
                          </span>
                        </div>
                      )}
                      {execution.metrics.avgHeartRate && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg HR</span>
                          <span className="text-sm text-foreground">{execution.metrics.avgHeartRate} bpm</span>
                        </div>
                      )}
                      {execution.metrics.avgPower && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Avg Power</span>
                          <span className="text-sm text-foreground">{execution.metrics.avgPower} W</span>
                        </div>
                      )}
                      {execution.metrics.trainingLoad && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">TSS</span>
                          <span className="text-sm text-foreground">{Math.round(execution.metrics.trainingLoad)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <PlayCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No execution data available</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-4">
          {complianceLoading ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : compliance ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">Compliance Status</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Adherence</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      compliance.adherence >= 80 ? "text-load-fresh" :
                      compliance.adherence >= 60 ? "text-load-optimal" :
                      "text-load-overreaching"
                    )}>
                      {compliance.adherence.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={cn(
                      "text-sm font-medium capitalize",
                      compliance.status === 'on_target' ? "text-load-fresh" :
                      compliance.status === 'over' ? "text-load-overreaching" :
                      compliance.status === 'under' ? "text-load-optimal" :
                      "text-muted-foreground"
                    )}>
                      {compliance.status.replace('_', ' ')}
                    </span>
                  </div>
                  {compliance.metrics && (
                    <div className="mt-4 space-y-3 pt-4 border-t border-border">
                      <h5 className="text-sm font-semibold text-foreground">Metric Comparison</h5>
                      {compliance.metrics.duration && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="text-foreground">
                              {compliance.metrics.duration.actual} / {compliance.metrics.duration.planned} min
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Diff: {compliance.metrics.duration.diff > 0 ? '+' : ''}{compliance.metrics.duration.diff.toFixed(0)}%
                          </div>
                        </div>
                      )}
                      {compliance.metrics.distance && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Distance</span>
                            <span className="text-foreground">
                              {convertDistance(compliance.metrics.distance.actual).value.toFixed(1)} / {convertDistance(compliance.metrics.distance.planned).value.toFixed(1)} {convertDistance(compliance.metrics.distance.actual).unit}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Diff: {compliance.metrics.distance.diff > 0 ? '+' : ''}{compliance.metrics.distance.diff.toFixed(0)}%
                          </div>
                        </div>
                      )}
                      {compliance.metrics.intensity && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Intensity</span>
                            <span className="text-foreground">
                              {compliance.metrics.intensity.actual} / {compliance.metrics.intensity.planned}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Match: {compliance.metrics.intensity.match ? 'Yes' : 'No'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No compliance data available</p>
            </div>
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
