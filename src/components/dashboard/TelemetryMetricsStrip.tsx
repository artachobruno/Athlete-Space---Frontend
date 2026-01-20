import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TelemetrySparklineSvg } from '@/components/telemetry/TelemetrySparklineSvg';
import { LoadBandSvg } from '@/components/telemetry/LoadBandSvg';
import { DeltaIndicatorSvg } from '@/components/telemetry/DeltaIndicatorSvg';
import { telemetryText, telemetryBorders } from '@/styles/telemetry-theme';

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
 * TelemetryMetricsStrip - F1-style telemetry visualizations
 * 
 * Displays:
 * - CTL sparkline (fitness trend)
 * - Load band (current vs optimal zone)
 * - TSB delta indicator (form change)
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

  // Get CTL history for sparkline (last 14 days, normalized 0-1)
  const ctlSparklineData = useMemo(() => {
    const metrics = overview60d?.metrics;
    const ctlData = Array.isArray(metrics?.ctl) ? metrics.ctl : [];
    
    if (ctlData.length === 0) return [];
    
    // Take last 14 points
    const recentCtl = ctlData.slice(-14).map(([, value]) => value);
    
    // Normalize to 0-1 range
    const minVal = Math.min(...recentCtl);
    const maxVal = Math.max(...recentCtl);
    const range = maxVal - minVal || 1;
    
    return recentCtl.map(v => (v - minVal) / range);
  }, [overview60d]);

  // Calculate TSB delta (7-day change)
  const tsbDelta = useMemo(() => {
    const metrics = overview60d?.metrics;
    const tsbData = Array.isArray(metrics?.tsb) ? metrics.tsb : [];
    
    if (tsbData.length < 7) return 0;
    
    const currentTsb = tsbData[tsbData.length - 1]?.[1] ?? tsb;
    const previousTsb = tsbData[tsbData.length - 7]?.[1] ?? tsb;
    
    return currentTsb - previousTsb;
  }, [overview60d, tsb]);

  // Calculate load position (ATL/CTL ratio normalized to 0-1)
  // Zone: 0.8-1.2 ratio is optimal, mapped to 0.4-0.7 on scale
  const loadPosition = useMemo(() => {
    if (ctl === 0) return 0.5;
    const ratio = atl / ctl;
    // Map ratio 0.5-1.5 to 0-1 scale
    return Math.max(0, Math.min(1, (ratio - 0.5) / 1.0));
  }, [atl, ctl]);

  // Determine if in optimal zone
  const inOptimalZone = useMemo(() => {
    if (ctl === 0) return true;
    const ratio = atl / ctl;
    return ratio >= 0.8 && ratio <= 1.2;
  }, [atl, ctl]);

  if (isLoading) {
    return (
      <div className={cn(
        'flex items-center justify-between py-3 px-6 border-y',
        telemetryBorders.divider,
        className
      )}>
        <div className="flex items-center gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-16 h-6 bg-slate-800/50 rounded animate-pulse" />
              <div className="w-8 h-4 bg-slate-800/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-between py-2.5 px-6 border-y bg-slate-950/30',
      telemetryBorders.divider,
      className
    )}>
      {/* CTL Trend Sparkline */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className={cn(telemetryText.label, 'text-[9px] tracking-[0.12em]')}>
            FITNESS TREND
          </span>
          <span className="f1-metric f1-metric-xs text-[hsl(var(--f1-text-primary))]">
            CTL {ctl.toFixed(0)}
          </span>
        </div>
        <TelemetrySparklineSvg
          data={ctlSparklineData.length > 0 ? ctlSparklineData : [0.5, 0.5]}
          width={100}
          height={28}
          stroke="hsl(210, 100%, 60%)"
          showIntensity
        />
      </div>

      {/* Vertical separator */}
      <div className={cn('w-px h-8', telemetryBorders.separator)} />

      {/* Load Band */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className={cn(telemetryText.label, 'text-[9px] tracking-[0.12em]')}>
            LOAD ZONE
          </span>
          <span className={cn(
            'f1-metric f1-metric-xs',
            inOptimalZone ? 'text-emerald-400' : 'text-amber-400'
          )}>
            {inOptimalZone ? 'OPTIMAL' : 'MONITOR'}
          </span>
        </div>
        <LoadBandSvg
          value={loadPosition}
          zoneStart={0.3}
          zoneEnd={0.7}
          width={120}
          height={10}
          inZone={inOptimalZone}
        />
      </div>

      {/* Vertical separator */}
      <div className={cn('w-px h-8', telemetryBorders.separator)} />

      {/* TSB Delta */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className={cn(telemetryText.label, 'text-[9px] tracking-[0.12em]')}>
            FORM Δ (7d)
          </span>
          <span className={cn(
            'f1-metric f1-metric-xs',
            tsbDelta > 0 ? 'text-emerald-400' : tsbDelta < -3 ? 'text-red-400' : 'text-slate-400'
          )}>
            {tsbDelta > 0 ? '+' : ''}{tsbDelta.toFixed(1)}
          </span>
        </div>
        <DeltaIndicatorSvg
          delta={tsbDelta}
          maxDelta={10}
          size={28}
          orientation="vertical"
        />
      </div>

      {/* Vertical separator */}
      <div className={cn('w-px h-8', telemetryBorders.separator)} />

      {/* Current TSB */}
      <div className="flex flex-col items-end">
        <span className={cn(telemetryText.label, 'text-[9px] tracking-[0.12em]')}>
          FORM (TSB)
        </span>
        <span className={cn(
          'f1-metric f1-metric-sm',
          tsb > 5 ? 'text-emerald-400' : tsb > 0 ? 'text-blue-400' : tsb > -10 ? 'text-amber-400' : 'text-red-400'
        )}>
          {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
