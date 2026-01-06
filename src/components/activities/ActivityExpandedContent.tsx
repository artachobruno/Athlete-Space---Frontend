import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import {
  Clock, Route, Heart, Zap, Mountain, Bot,
  TrendingUp, TrendingDown, Minus, CheckCircle2
} from 'lucide-react';
import { ActivityCharts } from './ActivityCharts';
import { ActivityMap } from './ActivityMap';
import { useUnitSystem } from '@/hooks/useUnitSystem';

interface ActivityExpandedContentProps {
  activity: CompletedActivity;
}

// Mock planned data for comparison
const mockPlannedData = {
  duration: 50,
  distance: 9,
  avgHeartRate: 145,
  avgPower: 240,
  intent: 'aerobic' as const,
};

export function ActivityExpandedContent({ activity }: ActivityExpandedContentProps) {
  const { convertDistance, convertElevation } = useUnitSystem();
  
  // Calculate comparison (using km for calculations, convert for display)
  const durationDiff = ((activity.duration - mockPlannedData.duration) / mockPlannedData.duration) * 100;
  const distanceDiff = ((activity.distance - mockPlannedData.distance) / mockPlannedData.distance) * 100;
  const hrDiff = activity.avgHeartRate
    ? ((activity.avgHeartRate - mockPlannedData.avgHeartRate) / mockPlannedData.avgHeartRate) * 100
    : 0;
  
  const distanceDisplay = convertDistance(activity.distance);
  const plannedDistanceDisplay = convertDistance(mockPlannedData.distance);
  const elevationDisplay = activity.elevation ? convertElevation(activity.elevation) : null;

  const getComplianceStatus = () => {
    const avgDiff = Math.abs(durationDiff) + Math.abs(distanceDiff) + Math.abs(hrDiff);
    if (avgDiff < 15) return { label: 'On Target', color: 'text-load-fresh', icon: CheckCircle2 };
    if (hrDiff > 5) return { label: 'Harder than intended', color: 'text-load-overreaching', icon: TrendingUp };
    if (hrDiff < -5) return { label: 'Easier than intended', color: 'text-load-optimal', icon: TrendingDown };
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

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          icon={Clock}
          label="Duration"
          value={`${activity.duration} min`}
          diff={durationDiff}
          planned={`${mockPlannedData.duration} min`}
        />
        <MetricCard
          icon={Route}
          label="Distance"
          value={`${distanceDisplay.value.toFixed(1)} ${distanceDisplay.unit}`}
          diff={distanceDiff}
          planned={`${plannedDistanceDisplay.value.toFixed(1)} ${plannedDistanceDisplay.unit}`}
        />
        {activity.avgHeartRate && (
          <MetricCard
            icon={Heart}
            label="Avg HR"
            value={`${activity.avgHeartRate} bpm`}
            diff={hrDiff}
            planned={`${mockPlannedData.avgHeartRate} bpm`}
          />
        )}
        {activity.avgPower && (
          <MetricCard
            icon={Zap}
            label="Avg Power"
            value={`${activity.avgPower} W`}
            planned={`${mockPlannedData.avgPower} W`}
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
          {hrDiff > 5 && (
            <HighlightChip
              type="warning"
              text="Higher effort than planned"
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
          <ActivityMap />
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
