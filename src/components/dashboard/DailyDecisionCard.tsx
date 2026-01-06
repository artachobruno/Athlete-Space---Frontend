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
    <Card className={cn('border', config.className)}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-lg', config.className)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                Today's Decision
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-2">{config.label}</h2>
            <p className="text-sm opacity-80">{reason}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
