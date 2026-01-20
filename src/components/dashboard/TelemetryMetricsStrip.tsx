import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface TelemetryMetricsStripProps {
  /** Overview data containing CTL/ATL/TSB metrics */
  overview60d?: {
    today: { ctl: number; atl: number; tsb: number };
    metrics: {
      ctl?: [string, number][];
      atl?: [string, number][];
      tsb?: [string, number][];
    };
  } | null;
  /** Loading state */
  isLoading?: boolean;
  className?: string;
}

/**
 * TelemetryMetricsStrip - Training metrics overview
 * 
 * Displays:
 * - CTL (fitness trend)
 * - Load status (ATL/CTL ratio)
 * - TSB (form)
 */
export function TelemetryMetricsStrip({ 
  overview60d, 
  isLoading = false,
  className 
}: TelemetryMetricsStripProps) {
  // Extract today's metrics
  const today = overview60d?.today;
  const ctl = typeof today?.ctl === 'number' ? today.ctl : 0;
  const atl = typeof today?.atl === 'number' ? today.atl : 0;
  const tsb = typeof today?.tsb === 'number' ? today.tsb : 0;

  // Calculate TSB delta (7-day change)
  const tsbDelta = useMemo(() => {
    const metrics = overview60d?.metrics;
    const tsbData = Array.isArray(metrics?.tsb) ? metrics.tsb : [];
    
    if (tsbData.length < 7) return 0;
    
    const currentTsb = tsbData[tsbData.length - 1]?.[1] ?? tsb;
    const previousTsb = tsbData[tsbData.length - 7]?.[1] ?? tsb;
    
    return currentTsb - previousTsb;
  }, [overview60d, tsb]);

  // Determine if in optimal zone
  const inOptimalZone = useMemo(() => {
    if (ctl === 0) return true;
    const ratio = atl / ctl;
    return ratio >= 0.8 && ratio <= 1.2;
  }, [atl, ctl]);

  if (isLoading) {
    return (
      <Card className={cn('p-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex flex-col gap-1">
                <div className="w-16 h-4 bg-secondary rounded animate-pulse" />
                <div className="w-12 h-6 bg-secondary rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* CTL (Fitness) */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Fitness (CTL)
          </span>
          <span className="text-xl font-semibold">
            {ctl.toFixed(0)}
          </span>
        </div>

        <div className="w-px h-10 bg-border hidden sm:block" />

        {/* ATL (Fatigue) */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Fatigue (ATL)
          </span>
          <span className="text-xl font-semibold">
            {atl.toFixed(0)}
          </span>
        </div>

        <div className="w-px h-10 bg-border hidden sm:block" />

        {/* Load Status */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Load Status
          </span>
          <span className={cn(
            'text-xl font-semibold',
            inOptimalZone ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          )}>
            {inOptimalZone ? 'Optimal' : 'Monitor'}
          </span>
        </div>

        <div className="w-px h-10 bg-border hidden sm:block" />

        {/* TSB (Form) */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Form (TSB)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              'text-xl font-semibold',
              tsb > 5 ? 'text-green-600 dark:text-green-400' : 
              tsb > 0 ? 'text-blue-600 dark:text-blue-400' : 
              tsb > -10 ? 'text-amber-600 dark:text-amber-400' : 
              'text-red-600 dark:text-red-400'
            )}>
              {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
            </span>
            <span className={cn(
              'text-sm',
              tsbDelta > 0 ? 'text-green-600 dark:text-green-400' : 
              tsbDelta < -3 ? 'text-red-600 dark:text-red-400' : 
              'text-muted-foreground'
            )}>
              {tsbDelta > 0 ? '↑' : tsbDelta < 0 ? '↓' : '→'} {Math.abs(tsbDelta).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
