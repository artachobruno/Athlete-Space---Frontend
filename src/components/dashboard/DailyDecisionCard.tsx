import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, RefreshCw, Moon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachDecisionV2 } from '@/types/coachDecision';
import { adaptLegacyDecision } from '@/lib/ai/adapters/adaptLegacyDecision';

/** Intelligence data structure from the API (supports both v1 and v2) */
interface IntelligenceData {
  recommendation?: string | null;
  explanation?: string | null;
  confidence?: {
    score: number;
    explanation?: string;
  } | null;
  // v2 fields
  version?: string;
  decision?: string;
  primary_focus?: string;
  signals?: string[];
  recommended_focus?: string[];
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

// Decision type mapping (v2 format)
type DecisionType = 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL';

const mapDecisionToType = (decision: string): DecisionType => {
  const upper = decision.toUpperCase();
  if (upper === 'REST' || upper === 'PROCEED' || upper === 'MODIFY' || upper === 'CANCEL') {
    return upper as DecisionType;
  }
  // Fallback for legacy values
  const lower = decision.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'REST';
  if (lower.includes('modify') || lower.includes('adjust')) return 'MODIFY';
  if (lower.includes('cancel') || lower.includes('skip')) return 'CANCEL';
  return 'PROCEED';
};

const decisionConfig: Record<DecisionType, { 
  icon: typeof CheckCircle2; 
  label: string; 
  displayLabel: string;
  colorClass: string; 
  bgClass: string;
}> = {
  PROCEED: { 
    icon: CheckCircle2, 
    label: 'Proceed', 
    displayLabel: 'PROCEED',
    colorClass: 'text-green-600 dark:text-green-400', 
    bgClass: 'bg-green-500/10',
  },
  MODIFY: { 
    icon: AlertCircle, 
    label: 'Modify', 
    displayLabel: 'MODIFY',
    colorClass: 'text-amber-600 dark:text-amber-400', 
    bgClass: 'bg-amber-500/10',
  },
  CANCEL: { 
    icon: AlertCircle, 
    label: 'Cancel', 
    displayLabel: 'CANCEL',
    colorClass: 'text-red-600 dark:text-red-400', 
    bgClass: 'bg-red-500/10',
  },
  REST: { 
    icon: Moon, 
    label: 'Rest', 
    displayLabel: 'REST DAY',
    colorClass: 'text-amber-600 dark:text-amber-400', 
    bgClass: 'bg-amber-500/10',
  },
};

/**
 * Normalize intelligence data to CoachDecisionV2
 * Handles both v1 and v2 formats, always returns v2
 */
function normalizeToV2(data: IntelligenceData | null | undefined): CoachDecisionV2 | null {
  if (!data) return null;
  
  // Check if already v2 format
  if (data.version === 'coach_decision_v2' && data.decision && data.signals && data.recommended_focus) {
    return {
      version: 'coach_decision_v2',
      decision: mapDecisionToType(data.decision) as 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL',
      primary_focus: data.primary_focus || 'Execute today appropriately',
      confidence: typeof data.confidence === 'object' && typeof data.confidence?.score === 'number'
        ? data.confidence.score
        : 0.8,
      signals: data.signals,
      recommended_focus: data.recommended_focus,
      explanation: data.explanation || undefined,
    };
  }
  
  // Legacy v1 format - adapt to v2
  if (data.recommendation && data.confidence) {
    const v1Decision = {
      recommendation: data.recommendation,
      explanation: data.explanation || data.recommendation || '',
      confidence: {
        score: typeof data.confidence === 'object' && typeof data.confidence.score === 'number'
          ? data.confidence.score
          : 0.8,
        explanation: typeof data.confidence === 'object' && typeof data.confidence.explanation === 'string'
          ? data.confidence.explanation
          : 'Based on current training state',
      },
    };
    return adaptLegacyDecision(v1Decision);
  }
  
  return null;
}

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

  // Normalize to v2 format
  const v2Decision = normalizeToV2(data);
  
  if (!v2Decision) {
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
  
  const decisionType = v2Decision.decision;
  const config = decisionConfig[decisionType];
  const Icon = config.icon;
  
  // Use v2 signals directly, fallback to explanation parsing only if empty
  const signals = v2Decision.signals && v2Decision.signals.length > 0
    ? v2Decision.signals
    : [];
  
  // Determine confidence label
  const confidenceLabel = v2Decision.confidence >= 0.8 
    ? 'High' 
    : v2Decision.confidence >= 0.6 
    ? 'Moderate' 
    : 'Low';

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Today's Decision</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Decision Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgClass)}>
              <Icon className={cn('h-5 w-5', config.colorClass)} />
            </div>
            <div className="flex-1">
              <div className={cn('text-2xl font-bold tracking-tight', config.colorClass)}>
                {config.displayLabel}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Primary Focus: {v2Decision.primary_focus}
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground pl-11">
            Confidence: {confidenceLabel} ({Math.round(v2Decision.confidence * 100)}%)
          </div>
        </div>
        
        {/* Why This Decision - signals first, never show long paragraphs */}
        {signals.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why This Decision
            </div>
            <ul className="space-y-1.5">
              {signals.map((signal, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1">•</span>
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Today's Focus - use v2 recommended_focus */}
        {v2Decision.recommended_focus && v2Decision.recommended_focus.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today's Focus
            </div>
            <ul className="space-y-1.5">
              {v2Decision.recommended_focus.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-muted-foreground/60 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
