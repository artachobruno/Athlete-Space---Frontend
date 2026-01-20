import { F1Card, F1CardLabel } from '@/components/ui/f1-card';
import { getTodayIntelligence } from '@/lib/intelligence';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, RefreshCw, Moon, Loader2, TrendingUp } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

// F1 Design: Map decisions to status colors
type DecisionType = 'proceed' | 'modify' | 'replace' | 'rest';
type F1Status = 'safe' | 'caution' | 'danger' | 'active';

const decisionToStatus: Record<DecisionType, F1Status> = {
  proceed: 'safe',
  modify: 'caution',
  replace: 'active',
  rest: 'caution',
};

// Telemetry-style decision labels (F1 pit wall language)
const decisionConfig = {
  proceed: {
    icon: CheckCircle2,
    label: 'PROCEED',
    sublabel: 'SYSTEMS GREEN',
    iconClass: 'f1-status-safe',
    bgClass: 'f1-status-safe-bg',
  },
  modify: {
    icon: AlertCircle,
    label: 'MODIFY',
    sublabel: 'REDUCE INTENSITY',
    iconClass: 'f1-status-caution',
    bgClass: 'f1-status-caution-bg',
  },
  replace: {
    icon: RefreshCw,
    label: 'REPLACE',
    sublabel: 'ALT SESSION',
    iconClass: 'f1-status-active',
    bgClass: 'f1-status-active-bg',
  },
  rest: {
    icon: Moon,
    label: 'REST',
    sublabel: 'RECOVERY REQUIRED',
    iconClass: 'f1-status-caution',
    bgClass: 'f1-status-caution-bg',
  },
};

const mapRecommendationToDecision = (recommendation: string | null | undefined): 'proceed' | 'modify' | 'replace' | 'rest' => {
  if (!recommendation || typeof recommendation !== 'string') {
    return 'proceed';
  }
  const lower = recommendation.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'rest';
  if (lower.includes('modify') || lower.includes('adjust')) return 'modify';
  if (lower.includes('replace') || lower.includes('change')) return 'replace';
  return 'proceed';
};

export function DailyDecisionCard() {
  const { data, isLoading, error } = useAuthenticatedQuery({
    queryKey: ['intelligence', 'today', 'current'],
    queryFn: () => getTodayIntelligence(),
    retry: 1,
    staleTime: 30 * 60 * 1000, // 30 minutes - intelligence is expensive
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour
  });

  if (isLoading) {
    return (
      <F1Card variant="strong" className="h-full" padding="lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[hsl(var(--f1-text-tertiary))]" />
        </div>
      </F1Card>
    );
  }

  // 503 means data isn't ready yet - show a friendly message
  const isServiceUnavailable = error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 503;
  
  if (isServiceUnavailable) {
    return (
      <F1Card variant="strong" className="h-full" padding="lg">
        <div className="text-center py-8">
          <p className="f1-body text-[hsl(var(--f1-text-secondary))]">Today&apos;s decision is being generated</p>
          <p className="f1-body-sm text-[hsl(var(--f1-text-muted))] mt-2">The coach will have your recommendation ready soon</p>
        </div>
      </F1Card>
    );
  }

  if (error || !data) {
    return (
      <F1Card variant="strong" className="h-full" padding="lg">
        <div className="text-center py-8">
          <p className="f1-body text-[hsl(var(--f1-text-secondary))]">Unable to load today&apos;s decision</p>
        </div>
      </F1Card>
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
      <F1Card variant="strong" className="h-full" padding="lg">
        <div className="text-center py-8">
          <p className="f1-body text-[hsl(var(--f1-text-secondary))]">Today&apos;s decision is being generated</p>
          <p className="f1-body-sm text-[hsl(var(--f1-text-muted))] mt-2">The coach will have your recommendation ready soon</p>
        </div>
      </F1Card>
    );
  }

  const decision = mapRecommendationToDecision(data.recommendation);
  const reason = data.explanation || data.recommendation;
  const confidence = data.confidence;
  const config = decisionConfig[decision];
  const status = decisionToStatus[decision];
  const Icon = config.icon;

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'f1-status-safe';
    if (score >= 0.6) return 'f1-status-active';
    if (score >= 0.4) return 'text-[hsl(var(--f1-text-tertiary))]';
    return 'f1-status-caution';
  };

  // Telemetry-style confidence labels
  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'HIGH';
    if (score >= 0.6) return 'MOD';
    if (score >= 0.4) return 'LOW';
    return 'V.LOW';
  };

  return (
    <F1Card variant="strong" status={status} className="h-full" padding="lg">
      {/* Telemetry row layout - flattened, no rounded icon containers */}
      <div className="flex items-start gap-4">
        {/* Status indicator - minimal, no background block */}
        <div className="pt-1">
          <Icon className={cn('h-6 w-6', config.iconClass)} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header row - label left, confidence right */}
          <div className="flex items-center justify-between mb-1">
            <F1CardLabel>TODAY&apos;S DECISION</F1CardLabel>
            {confidence && (
              <span className={cn('f1-label flex items-center gap-1', getConfidenceColor(confidence.score))}>
                <TrendingUp className="h-3 w-3" />
                CONF: {getConfidenceLabel(confidence.score)} ({Math.round(confidence.score * 100)}%)
              </span>
            )}
          </div>
          
          {/* Decision value row - telemetry style with sublabel */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className="f1-metric f1-metric-lg">{config.label}</span>
            <span className="f1-label text-[hsl(var(--f1-text-tertiary))]">· {config.sublabel}</span>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-[var(--border-subtle)] my-3" />
          
          {/* Explanation - telemetry log style */}
          <p className="f1-body text-[hsl(var(--f1-text-secondary))] leading-relaxed">{reason}</p>
          
          {/* Confidence explanation - inline telemetry note */}
          {confidence && confidence.explanation && (
            <p className="f1-label text-[hsl(var(--f1-text-muted))] mt-3 leading-relaxed">
              SIGNAL: {confidence.explanation}
            </p>
          )}
        </div>
      </div>
    </F1Card>
  );
}
