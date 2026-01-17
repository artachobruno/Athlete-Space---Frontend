import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchOverview } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

const statusStyles = {
  fresh: 'text-load-fresh',
  optimal: 'text-load-optimal',
  overreaching: 'text-load-overreaching',
  overtraining: 'text-load-overtraining',
};

const getLoadStatus = (tsb: number): { status: keyof typeof statusStyles; description: string } => {
  if (tsb > 5) return { status: 'fresh', description: 'Fresh - Ready for hard training' };
  if (tsb > 0) return { status: 'optimal', description: 'Optimal - Good training balance' };
  if (tsb > -5) return { status: 'overreaching', description: 'Overreaching - Reduce intensity' };
  return { status: 'overtraining', description: 'Overtraining - Rest required' };
};

export function LoadStatusCard() {
  const { data: overview, isLoading, error } = useAuthenticatedQuery({
    queryKey: ['overview', 60],
    queryFn: () => {
      console.log('[LoadStatusCard] Fetching overview for 60 days');
      return fetchOverview(60);
    },
    retry: 1,
    staleTime: 0, // Always refetch - training load changes frequently
    refetchOnMount: true, // Force fresh data on page load
    refetchOnWindowFocus: true, // Refetch when window regains focus
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes after unmount
  });

  if (isLoading) {
    return (
      <GlassCard>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Training Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  if (error || !overview) {
    return (
      <GlassCard>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Training Load</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground text-sm">
            Unable to load training data
          </div>
        </CardContent>
      </GlassCard>
    );
  }

  // Safely extract today's values with fallbacks
  const today = overview?.today as { ctl?: number; atl?: number; tsb?: number } || {};
  const ctl = typeof today.ctl === 'number' ? today.ctl : 0;
  const atl = typeof today.atl === 'number' ? today.atl : 0;
  const tsb = typeof today.tsb === 'number' ? today.tsb : 0;
  
  console.debug('[LoadStatusCard] Today metrics:', { ctl, atl, tsb });
  
  const loadStatus = getLoadStatus(tsb);
  
  // Calculate CTL trend from metrics
  const metrics = overview?.metrics || {};
  const ctlData = Array.isArray(metrics.ctl) ? metrics.ctl : [];
  const latestCtl = ctl;
  const previousCtl = ctlData.length >= 7 && ctlData[ctlData.length - 7]?.[1] !== undefined
    ? ctlData[ctlData.length - 7][1]
    : ctl;
  const ctlTrend = latestCtl - previousCtl;
  const TrendIcon = ctlTrend > 2 ? TrendingUp : ctlTrend < -2 ? TrendingDown : Minus;

  return (
    <GlassCard className="h-full min-h-[220px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Training Load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TSB Status */}
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <div className={cn('text-3xl font-bold', statusStyles[loadStatus.status])}>
            {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
            Form (TSB)
          </div>
        </div>

        {/* Status description */}
        <div className={cn('text-sm text-center', statusStyles[loadStatus.status])}>
          {loadStatus.description}
        </div>

        {/* CTL/ATL */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <span className="text-xl font-semibold text-foreground">
                {ctl.toFixed(0)}
              </span>
              <TrendIcon className={cn(
                'h-4 w-4',
                ctlTrend > 2 ? 'text-load-fresh' : ctlTrend < -2 ? 'text-load-overtraining' : 'text-muted-foreground'
              )} />
            </div>
            <div className="text-xs text-muted-foreground">Fitness (CTL)</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold text-foreground">
              {atl.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Fatigue (ATL)</div>
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}
