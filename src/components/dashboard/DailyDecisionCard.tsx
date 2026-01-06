import { Card, CardContent } from '@/components/ui/card';
import { getTodayIntelligence } from '@/lib/intelligence';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, RefreshCw, Moon, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

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

const mapRecommendationToDecision = (recommendation: string): 'proceed' | 'modify' | 'replace' | 'rest' => {
  const lower = recommendation.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'rest';
  if (lower.includes('modify') || lower.includes('adjust')) return 'modify';
  if (lower.includes('replace') || lower.includes('change')) return 'replace';
  return 'proceed';
};

export function DailyDecisionCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todayIntelligence'],
    queryFn: getTodayIntelligence,
    retry: 1,
  });

  if (isLoading) {
    return (
      <Card className={cn('border-2 h-full')}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // 503 means data isn't ready yet - show a friendly message
  const isServiceUnavailable = error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 503;
  
  if (isServiceUnavailable) {
    return (
      <Card className={cn('border-2 h-full')}>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Today&apos;s decision is being generated</p>
            <p className="text-xs mt-2 opacity-70">The coach will have your recommendation ready soon</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn('border-2 h-full')}>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Unable to load today&apos;s decision</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const decision = mapRecommendationToDecision(data.recommendation);
  const reason = data.explanation || data.recommendation;
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
