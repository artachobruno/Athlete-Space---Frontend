import { Card, CardContent } from '@/components/ui/card';
import { getTodayDecision } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, RefreshCw, Moon } from 'lucide-react';

const decisionConfig = {
  proceed: {
    icon: CheckCircle2,
    label: 'Proceed',
    className: 'bg-decision-proceed/10 text-decision-proceed border-decision-proceed/20',
  },
  modify: {
    icon: AlertCircle,
    label: 'Modify',
    className: 'bg-decision-modify/10 text-decision-modify border-decision-modify/20',
  },
  replace: {
    icon: RefreshCw,
    label: 'Replace',
    className: 'bg-decision-replace/10 text-decision-replace border-decision-replace/20',
  },
  rest: {
    icon: Moon,
    label: 'Rest',
    className: 'bg-decision-rest/10 text-decision-rest border-decision-rest/20',
  },
};

export function DailyDecisionCard() {
  const { decision, reason } = getTodayDecision();
  const config = decisionConfig[decision];
  const Icon = config.icon;

  return (
    <Card className={cn('border-2 h-full', config.className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn('p-4 rounded-xl', config.className)}>
            <Icon className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                Today&apos;s Decision
              </span>
            </div>
            <h2 className="text-2xl font-bold mb-3">{config.label}</h2>
            <p className="text-sm opacity-80 leading-relaxed">{reason}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
