import { useDashboardData } from '@/hooks/useDashboardData';
import { cn } from '@/lib/utils';
import { telemetryText, telemetryTypography, telemetryBorders } from '@/styles/telemetry-theme';

/**
 * Status item for the telemetry rail
 */
interface StatusItem {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'safe' | 'caution' | 'danger' | 'active';
}

/**
 * Trend indicator arrow
 */
function TrendIndicator({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (!trend || trend === 'stable') return null;
  
  return (
    <span className="ml-1 text-[10px]">
      {trend === 'up' ? '↑' : '↓'}
    </span>
  );
}

/**
 * Get training phase from CTL trend
 */
function getTrainingPhase(ctlTrend: number): { value: string; trend: 'up' | 'down' | 'stable' } {
  if (ctlTrend > 2) return { value: 'BUILDING', trend: 'up' };
  if (ctlTrend < -2) return { value: 'RECOVERING', trend: 'down' };
  return { value: 'MAINTAINING', trend: 'stable' };
}

/**
 * Get load status from ATL vs CTL ratio
 */
function getLoadStatus(atl: number, ctl: number): { value: string; trend: 'up' | 'down' | 'stable' } {
  const ratio = ctl > 0 ? atl / ctl : 1;
  if (ratio > 1.2) return { value: 'ELEVATED', trend: 'up' };
  if (ratio < 0.8) return { value: 'REDUCED', trend: 'down' };
  return { value: 'WITHIN RANGE', trend: 'stable' };
}

/**
 * Get risk level from TSB
 */
function getRiskLevel(tsb: number): { value: string; status: 'safe' | 'caution' | 'danger' } {
  if (tsb > 0) return { value: 'LOW', status: 'safe' };
  if (tsb > -10) return { value: 'MODERATE', status: 'caution' };
  return { value: 'HIGH', status: 'danger' };
}

interface TelemetryStatusRailProps {
  className?: string;
}

/**
 * TelemetryStatusRail - Dashboard status strip
 * 
 * This is the bridge between landing and dashboard.
 * Matches the landing TelemetryStatusBand visual language.
 * 
 * Structure: STATUS | LOAD | READINESS | RISK
 * 
 * Rules:
 * - Thin horizontal strip
 * - No cards, no shadows, no background blocks
 * - Must visually match the landing telemetry band
 */
export function TelemetryStatusRail({ className }: TelemetryStatusRailProps) {
  const dashboardData = useDashboardData();
  
  // Extract metrics from dashboard data
  const overview = dashboardData.overview60d;
  const today = overview?.today as { ctl?: number; atl?: number; tsb?: number } | undefined;
  
  const ctl = typeof today?.ctl === 'number' ? today.ctl : 0;
  const atl = typeof today?.atl === 'number' ? today.atl : 0;
  const tsb = typeof today?.tsb === 'number' ? today.tsb : 0;
  
  // Calculate CTL trend from metrics
  const metrics = overview?.metrics as { ctl?: [string, number][] } | undefined;
  const ctlData = Array.isArray(metrics?.ctl) ? metrics.ctl : [];
  const previousCtl = ctlData.length >= 7 && ctlData[ctlData.length - 7]?.[1] !== undefined
    ? ctlData[ctlData.length - 7][1]
    : ctl;
  const ctlTrend = ctl - previousCtl;
  
  // Derive status values
  const trainingPhase = getTrainingPhase(ctlTrend);
  const loadStatus = getLoadStatus(atl, ctl);
  const riskLevel = getRiskLevel(tsb);
  
  // Calculate readiness from TSB (normalized to percentage)
  const readiness = Math.max(0, Math.min(100, Math.round(50 + tsb * 2)));
  
  const statusItems: StatusItem[] = [
    { label: 'STATUS', value: trainingPhase.value, trend: trainingPhase.trend },
    { label: 'LOAD', value: loadStatus.value, trend: loadStatus.trend },
    { label: 'READINESS', value: `${readiness}%`, trend: tsb > 0 ? 'up' : tsb < -5 ? 'down' : 'stable' },
    { label: 'RISK', value: riskLevel.value, status: riskLevel.status },
  ];

  const isLoading = dashboardData.overview60dLoading;

  // Status color mapping
  const getStatusColor = (status?: 'safe' | 'caution' | 'danger' | 'active') => {
    switch (status) {
      case 'safe': return 'text-emerald-400';
      case 'caution': return 'text-amber-400';
      case 'danger': return 'text-red-400';
      case 'active': return 'text-blue-400';
      default: return telemetryText.primary;
    }
  };

  return (
    <div className={cn('w-full border-b', telemetryBorders.divider, className)}>
      <div className={cn(
        'flex items-center gap-6 px-6 py-2.5',
        telemetryTypography.statusLabel
      )}>
        {statusItems.map((item, index) => (
          <div key={item.label} className="flex items-center">
            {index > 0 && (
              <div className={cn('w-px h-2.5 mr-5', telemetryBorders.separator)} />
            )}
            <div className="flex items-center gap-1.5">
              <span className={cn(telemetryText.label, 'text-[9px] tracking-[0.14em]')}>{item.label}</span>
              {isLoading ? (
                <span className={cn(telemetryText.muted, 'animate-pulse text-[9px]')}>---</span>
              ) : (
                <span className={cn(
                  'flex items-center text-[10px] tracking-[0.08em] font-mono',
                  item.status ? getStatusColor(item.status) : telemetryText.primary
                )}>
                  <TrendIndicator trend={item.trend} />
                  {item.value}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
