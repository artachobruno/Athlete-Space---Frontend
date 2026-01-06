import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentLoadStatus, mockTrainingLoad } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const statusStyles = {
  fresh: 'text-load-fresh',
  optimal: 'text-load-optimal',
  overreaching: 'text-load-overreaching',
  overtraining: 'text-load-overtraining',
};

export function LoadStatusCard() {
  const loadStatus = getCurrentLoadStatus();
  const latest = mockTrainingLoad[mockTrainingLoad.length - 1];
  const previous = mockTrainingLoad[mockTrainingLoad.length - 8]; // Week ago

  const ctlTrend = latest.ctl - previous.ctl;
  const TrendIcon = ctlTrend > 2 ? TrendingUp : ctlTrend < -2 ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Training Load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* TSB Status */}
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <div className={cn('text-3xl font-bold', statusStyles[loadStatus.status])}>
            {loadStatus.tsb > 0 ? '+' : ''}{loadStatus.tsb.toFixed(0)}
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
                {latest.ctl.toFixed(0)}
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
              {latest.atl.toFixed(0)}
            </div>
            <div className="text-xs text-muted-foreground">Fatigue (ATL)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
