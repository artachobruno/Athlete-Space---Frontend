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

const getLoadStatus = (tsb: number): { status: keyof typeof statusStyles; description: string } => {
  if (tsb > 5) return { status: 'fresh', description: 'Fresh - Ready for hard training' };
  if (tsb > 0) return { status: 'optimal', description: 'Optimal - Good training balance' };
  if (tsb > -5) return { status: 'overreaching', description: 'Overreaching - Reduce intensity' };
  return { status: 'overtraining', description: 'Overtraining - Rest required' };
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

  return (
    <F1Card className="h-full min-h-[220px]" status={f1Status}>
      <F1CardHeader>
        <F1CardTitle>Training Load</F1CardTitle>
      </F1CardHeader>
      
      <div className="space-y-4">
        {/* TSB Status - Primary telemetry display */}
        <div className="text-center py-4 rounded-f1 bg-[var(--surface-glass-subtle)]">
          <div className={cn('f1-metric f1-metric-lg', statusStyles[loadStatus.status])}>
            {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
          </div>
          <F1CardLabel className="mt-2 block">Form (TSB)</F1CardLabel>
        </div>

        {/* Status description */}
        <div className={cn('f1-body-sm text-center', statusStyles[loadStatus.status])}>
          {loadStatus.description}
        </div>

        <F1Divider />

        {/* CTL/ATL - Secondary metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="f1-metric f1-metric-md">
                {ctl.toFixed(0)}
              </span>
              <TrendIcon className={cn(
                'h-4 w-4',
                ctlTrend > 2 ? 'f1-status-safe' : ctlTrend < -2 ? 'f1-status-danger' : 'text-[hsl(var(--f1-text-tertiary))]'
              )} />
            </div>
            <F1CardLabel className="mt-1 block">Fitness (CTL)</F1CardLabel>
          </div>
          <div className="text-center">
            <span className="f1-metric f1-metric-md">
              {atl.toFixed(0)}
            </span>
            <F1CardLabel className="mt-1 block">Fatigue (ATL)</F1CardLabel>
          </div>
        </div>
      </div>
    </F1Card>
  );
}
