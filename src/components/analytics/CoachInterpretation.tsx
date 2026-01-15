import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingLoad } from '@/types';

interface CoachInterpretationProps {
  data: TrainingLoad[];
  isAdvanced: boolean;
}

export function CoachInterpretation({ data, isAdvanced }: CoachInterpretationProps) {
  const analysis = useMemo(() => {
    if (data.length < 7) return null;

    const latest = data[data.length - 1];
    const weekAgo = data[Math.max(0, data.length - 7)];
    const twoWeeksAgo = data[Math.max(0, data.length - 14)];

    const ctlTrend = latest.ctl - weekAgo.ctl;
    const atlTrend = latest.atl - weekAgo.atl;
    const tsbCurrent = latest.tsb;

    // Find inflection points
    const inflectionPoints: string[] = [];
    
    // Check for fitness gains
    if (ctlTrend > 2) {
      inflectionPoints.push('fitness is trending upward');
    } else if (ctlTrend < -2) {
      inflectionPoints.push('fitness has slightly declined');
    }

    // Check for fatigue spikes
    if (atlTrend > 5) {
      inflectionPoints.push('recent training has increased fatigue');
    }

    // Check TSB state
    let stateDescription = '';
    let stateIcon = Minus;
    let stateColor = 'text-muted-foreground';

    if (tsbCurrent > 15) {
      stateDescription = 'well-rested and ready for hard training';
      stateIcon = Zap;
      stateColor = 'text-load-fresh';
    } else if (tsbCurrent > 0) {
      stateDescription = 'in good form with balanced recovery';
      stateIcon = TrendingUp;
      stateColor = 'text-load-optimal';
    } else if (tsbCurrent > -15) {
      stateDescription = 'productively fatigued from training';
      stateIcon = Minus;
      stateColor = 'text-muted-foreground';
    } else if (tsbCurrent > -25) {
      stateDescription = 'accumulating significant fatigue';
      stateIcon = TrendingDown;
      stateColor = 'text-load-overreaching';
    } else {
      stateDescription = 'showing signs of overreaching';
      stateIcon = AlertTriangle;
      stateColor = 'text-load-overtraining';
    }

    // Build simple summary
    const simpleSummary = `You're currently ${stateDescription}. ${
      ctlTrend > 0 
        ? 'Your fitness has been improving over the past week.' 
        : 'Focus on consistency to rebuild momentum.'
    }`;

    // Build advanced summary
    const advancedSummary = [
      `Your Training Stress Balance (TSB) of ${tsbCurrent.toFixed(0)} indicates you're ${stateDescription}.`,
      `Chronic Training Load (CTL) ${ctlTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(ctlTrend).toFixed(1)} points over the last week, ${ctlTrend > 0 ? 'showing fitness gains' : 'suggesting a recovery phase'}.`,
      inflectionPoints.length > 0 
        ? `Key observations: ${inflectionPoints.join(', ')}.`
        : 'Training load has been relatively stable.',
    ].join(' ');

    return {
      simpleSummary,
      advancedSummary,
      stateIcon,
      stateColor,
      tsb: tsbCurrent,
      ctl: latest.ctl,
      atl: latest.atl,
      ctlTrend,
    };
  }, [data]);

  if (!analysis) return null;

  const StateIcon = analysis.stateIcon;

  return (
    <GlassCard>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-coach text-coach-foreground">
            <Brain className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-foreground">Coach Analysis</span>
              <StateIcon className={cn('h-4 w-4', analysis.stateColor)} />
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {isAdvanced ? analysis.advancedSummary : analysis.simpleSummary}
            </p>

            {/* Quick Stats for Advanced */}
            {isAdvanced && (
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground">Fitness (CTL)</div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-semibold text-foreground">
                      {analysis.ctl.toFixed(0)}
                    </span>
                    <span className={cn(
                      'text-xs',
                      analysis.ctlTrend > 0 ? 'text-load-fresh' : 'text-muted-foreground'
                    )}>
                      {analysis.ctlTrend > 0 ? '+' : ''}{analysis.ctlTrend.toFixed(1)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Fatigue (ATL)</div>
                  <div className="text-lg font-semibold text-foreground">
                    {analysis.atl.toFixed(0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Form (TSB)</div>
                  <div className={cn('text-lg font-semibold', analysis.stateColor)}>
                    {analysis.tsb > 0 ? '+' : ''}{analysis.tsb.toFixed(0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}
