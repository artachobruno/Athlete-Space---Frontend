import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, RefreshCw, Moon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Intelligence data structure from the API */
interface IntelligenceData {
  recommendation?: string | null;
  explanation?: string | null;
  confidence?: {
    score: number;
    explanation?: string;
  } | null;
}

interface DailyDecisionCardProps {
  /** Today's intelligence data from useDashboardData */
  todayIntelligence?: IntelligenceData | null;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: unknown;
  /** Additional CSS classes */
  className?: string;
}

// Decision type mapping
type DecisionType = 'proceed' | 'modify' | 'replace' | 'rest';

const mapRecommendationToDecision = (recommendation: string | null | undefined): DecisionType => {
  if (!recommendation || typeof recommendation !== 'string') {
    return 'proceed';
  }
  const lower = recommendation.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'rest';
  if (lower.includes('modify') || lower.includes('adjust')) return 'modify';
  if (lower.includes('replace') || lower.includes('change')) return 'replace';
  return 'proceed';
};

const decisionConfig: Record<DecisionType, { icon: typeof CheckCircle2; label: string; colorClass: string; bgClass: string }> = {
  proceed: { icon: CheckCircle2, label: 'Proceed', colorClass: 'text-green-600 dark:text-green-400', bgClass: 'bg-green-500/10' },
  modify: { icon: AlertCircle, label: 'Modify', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-500/10' },
  replace: { icon: RefreshCw, label: 'Replace', colorClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-500/10' },
  rest: { icon: Moon, label: 'Rest', colorClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-500/10' },
};

export function DailyDecisionCard({ todayIntelligence, isLoading = false, error, className }: DailyDecisionCardProps) {
  const data = todayIntelligence;

  if (isLoading) {
    return (
      <Card className={cn('h-full flex flex-col', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Decision</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // 503 means data isn't ready yet
  const isServiceUnavailable = error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 503;
  
  if (isServiceUnavailable) {
    return (
      <Card className={cn('h-full flex flex-col', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Decision</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Analyzing your training data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn('h-full flex flex-col', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Decision</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Decision unavailable</p>
        </CardContent>
      </Card>
    );
  }

  // Check if this is a placeholder decision (not yet generated)
  const isPlaceholder = 
    (data.confidence?.score === 0.0 && 
     (data.confidence?.explanation === "Decision not yet generated" || 
      data.explanation === "The coach is still analyzing your training data. Recommendations will be available soon.")) ||
    (data.explanation === "The coach is still analyzing your training data. Recommendations will be available soon.") ||
    (data.confidence?.explanation === "Decision not yet generated");

  if (isPlaceholder) {
    return (
      <Card className={cn('h-full flex flex-col', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Decision</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Analyzing your training data...</p>
        </CardContent>
      </Card>
    );
  }

  const decision = mapRecommendationToDecision(data.recommendation);
  const reason = data.explanation || data.recommendation;
  const confidence = data.confidence;
  const config = decisionConfig[decision];
  const Icon = config.icon;

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today's Decision</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Decision indicator */}
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('p-2 rounded-lg', config.bgClass)}>
            <Icon className={cn('h-5 w-5', config.colorClass)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xl font-semibold', config.colorClass)}>{config.label}</span>
            </div>
            {confidence && (
              <span className="text-xs text-muted-foreground">
                {Math.round(confidence.score * 100)}% confidence
              </span>
            )}
          </div>
        </div>
        
        {/* Explanation */}
        {reason && (
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">
            {reason}
          </p>
        )}
        
        {/* Confidence explanation */}
        {confidence && confidence.explanation && confidence.explanation !== "Decision not yet generated" && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
            {confidence.explanation}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
