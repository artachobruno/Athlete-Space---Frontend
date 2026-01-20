import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel, F1Metric, F1Divider } from '@/components/ui/f1-card';
import { fetchOverview } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

interface LoadStatusCardProps {
  overview60d?: {
    today: { ctl: number; atl: number; tsb: number };
    metrics: {
      ctl?: [string, number][];
      atl?: [string, number][];
      tsb?: [string, number][];
    };
  } | null;
  isLoading?: boolean;
  error?: unknown;
}

// F1 Design: Map load status to F1 status colors
type LoadStatus = 'fresh' | 'optimal' | 'overreaching' | 'overtraining';
type F1Status = 'safe' | 'caution' | 'danger' | 'active';

const statusToF1: Record<LoadStatus, F1Status> = {
  fresh: 'safe',
  optimal: 'active',
  overreaching: 'caution',
  overtraining: 'danger',
};

const statusStyles: Record<LoadStatus, string> = {
  fresh: 'f1-status-safe',
  optimal: 'f1-status-active',
  overreaching: 'f1-status-caution',
  overtraining: 'f1-status-danger',
};

// Telemetry-style status descriptions (F1 pit wall language)
const getLoadStatus = (tsb: number): { status: keyof typeof statusStyles; description: string; code: string } => {
  if (tsb > 5) return { status: 'fresh', description: 'READY FOR HIGH LOAD', code: 'FRESH' };
  if (tsb > 0) return { status: 'optimal', description: 'BALANCED · NOMINAL', code: 'OPTIMAL' };
  if (tsb > -5) return { status: 'overreaching', description: 'REDUCE INTENSITY', code: 'STRAIN' };
  return { status: 'overtraining', description: 'RECOVERY REQUIRED', code: 'CRITICAL' };
};

export function LoadStatusCard(props?: LoadStatusCardProps) {
  // Use props if provided, otherwise fetch (backward compatibility)
  const propsOverview = props?.overview60d;
  const propsIsLoading = props?.isLoading;
  const propsError = props?.error;

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useAuthenticatedQuery({
    queryKey: ['overview', 60],
    queryFn: () => {
      console.log('[LoadStatusCard] Fetching overview for 60 days');
      return fetchOverview(60);
    },
    retry: 1,
    enabled: propsOverview === undefined, // Only fetch if props not provided
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Use props if provided, otherwise use fetched data
  const finalOverview = propsOverview !== undefined ? propsOverview : overview;
  const isLoading = propsIsLoading !== undefined ? propsIsLoading : overviewLoading;
  const error = propsError !== undefined ? propsError : overviewError;

  if (isLoading) {
    return (
      <F1Card className="h-full min-h-[220px]">
        <F1CardHeader>
          <F1CardTitle>Training Load</F1CardTitle>
        </F1CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--f1-text-tertiary))]" />
        </div>
      </F1Card>
    );
  }

  if (error || !finalOverview) {
    return (
      <F1Card className="h-full min-h-[220px]">
        <F1CardHeader>
          <F1CardTitle>Training Load</F1CardTitle>
        </F1CardHeader>
        <div className="text-center py-8">
          <p className="f1-body text-[hsl(var(--f1-text-tertiary))]">Unable to load training data</p>
        </div>
      </F1Card>
    );
  }

  // Safely extract today's values with fallbacks
  const today = finalOverview?.today as { ctl?: number; atl?: number; tsb?: number } || {};
  const ctl = typeof today.ctl === 'number' ? today.ctl : 0;
  const atl = typeof today.atl === 'number' ? today.atl : 0;
  const tsb = typeof today.tsb === 'number' ? today.tsb : 0;
  
  console.debug('[LoadStatusCard] Today metrics:', { ctl, atl, tsb });
  
  const loadStatus = getLoadStatus(tsb);
  
  // Calculate CTL trend from metrics
  const metrics = finalOverview?.metrics || {};
  const ctlData = Array.isArray(metrics.ctl) ? metrics.ctl : [];
  const latestCtl = ctl;
  const previousCtl = ctlData.length >= 7 && ctlData[ctlData.length - 7]?.[1] !== undefined
    ? ctlData[ctlData.length - 7][1]
    : ctl;
  const ctlTrend = latestCtl - previousCtl;
  const TrendIcon = ctlTrend > 2 ? TrendingUp : ctlTrend < -2 ? TrendingDown : Minus;

  const f1Status = statusToF1[loadStatus.status];

  // Format trend indicator
  const trendArrow = ctlTrend > 2 ? '↑' : ctlTrend < -2 ? '↓' : '→';

  return (
    <F1Card className="h-full min-h-[200px]" status={f1Status}>
      <F1CardHeader>
        <F1CardTitle>LOAD STATUS</F1CardTitle>
      </F1CardHeader>
      
      <div className="space-y-2.5">
        {/* Primary metric row - TSB with status code */}
        <div className="flex items-baseline justify-between py-1.5 border-b border-[var(--border-subtle)]">
          <span className="f1-label text-[hsl(var(--f1-text-muted))]">FORM (TSB)</span>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('f1-metric f1-metric-md', statusStyles[loadStatus.status])}>
              {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
            </span>
            <span className={cn('f1-label', statusStyles[loadStatus.status])}>
              {loadStatus.code}
            </span>
          </div>
        </div>

        {/* Status description row */}
        <div className={cn('f1-label py-0.5', statusStyles[loadStatus.status])}>
          {loadStatus.description}
        </div>

        <F1Divider />

        {/* Secondary metrics - horizontal telemetry rows */}
        <div className="space-y-1.5">
          {/* CTL Row */}
          <div className="flex items-center justify-between py-0.5">
            <span className="f1-label text-[hsl(var(--f1-text-muted))]">FITNESS (CTL)</span>
            <div className="flex items-center gap-1.5">
              <span className="f1-metric f1-metric-sm">{ctl.toFixed(0)}</span>
              <span className={cn(
                'f1-label',
                ctlTrend > 2 ? 'f1-status-safe' : ctlTrend < -2 ? 'f1-status-danger' : 'text-[hsl(var(--f1-text-muted))]'
              )}>
                {trendArrow} {Math.abs(ctlTrend).toFixed(0)}
              </span>
            </div>
          </div>
          
          {/* ATL Row */}
          <div className="flex items-center justify-between py-0.5">
            <span className="f1-label text-[hsl(var(--f1-text-muted))]">FATIGUE (ATL)</span>
            <span className="f1-metric f1-metric-sm">{atl.toFixed(0)}</span>
          </div>
        </div>
      </div>
    </F1Card>
  );
}
