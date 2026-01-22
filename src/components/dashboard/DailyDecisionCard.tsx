import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, RefreshCw, Moon, Loader2, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoachDecisionV2, CoachDecision } from '@/types/coachDecision';
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
  todayIntelligence?: CoachDecision | IntelligenceData | null;
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
  // Fallback for legacy values and new recommendation types
  const lower = decision.toLowerCase();
  if (lower.includes('rest') || lower.includes('recovery')) return 'REST';
  if (lower.includes('easy_with_caution') || lower.includes('moderate_with_caution')) return 'MODIFY';
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
  accentStripClass: string;
  readinessLabel: string;
}> = {
  PROCEED: { 
    icon: CheckCircle2, 
    label: 'Proceed', 
    displayLabel: 'PROCEED',
    colorClass: 'text-green-600 dark:text-green-400', 
    bgClass: 'bg-green-500/10',
    accentStripClass: 'bg-green-500',
    readinessLabel: 'READINESS: HIGH',
  },
  MODIFY: { 
    icon: AlertCircle, 
    label: 'Modify', 
    displayLabel: 'MODIFY',
    colorClass: 'text-amber-600 dark:text-amber-400', 
    bgClass: 'bg-amber-500/10',
    accentStripClass: 'bg-blue-500',
    readinessLabel: 'READINESS: MODERATE → MODIFY RECOMMENDED',
  },
  CANCEL: { 
    icon: AlertCircle, 
    label: 'Cancel', 
    displayLabel: 'CANCEL',
    colorClass: 'text-red-600 dark:text-red-400', 
    bgClass: 'bg-red-500/10',
    accentStripClass: 'bg-red-500',
    readinessLabel: 'READINESS: LOW → RECOVERY RECOMMENDED',
  },
  REST: { 
    icon: Moon, 
    label: 'Rest', 
    displayLabel: 'REST DAY',
    colorClass: 'text-amber-600 dark:text-amber-400', 
    bgClass: 'bg-amber-500/10',
    accentStripClass: 'bg-yellow-500',
    readinessLabel: 'READINESS: LOW → RECOVERY RECOMMENDED',
  },
};

/**
 * Normalize intelligence data to CoachDecisionV2
 * Handles both v1 and v2 formats, always returns v2
 */
function normalizeToV2(data: CoachDecision | IntelligenceData | null | undefined): CoachDecisionV2 | null {
  if (!data) return null;
  
  // Check if already CoachDecisionV2 format
  if (typeof data === 'object' && 'version' in data && data.version === 'coach_decision_v2') {
    return data as CoachDecisionV2;
  }
  
  // Check if already v2 format (IntelligenceData with v2 fields)
  if (typeof data === 'object' && 'version' in data && data.version === 'coach_decision_v2' && 'decision' in data && 'signals' in data && 'recommended_focus' in data) {
    const intelData = data as IntelligenceData;
    return {
      version: 'coach_decision_v2',
      decision: mapDecisionToType(intelData.decision || '') as 'REST' | 'PROCEED' | 'MODIFY' | 'CANCEL',
      primary_focus: intelData.primary_focus || 'Execute today appropriately',
      confidence: typeof intelData.confidence === 'object' && typeof intelData.confidence?.score === 'number'
        ? intelData.confidence.score
        : 0.8,
      signals: intelData.signals || [],
      recommended_focus: intelData.recommended_focus || [],
      explanation: intelData.explanation || undefined,
    };
  }
  
  // Legacy v1 format (DailyDecisionV1 or IntelligenceData with recommendation)
  if (typeof data === 'object' && 'recommendation' in data && data.recommendation) {
    const v1Data = data as { recommendation: string; explanation?: string; confidence?: { score?: number; explanation?: string } | number };
    const v1Decision = {
      recommendation: v1Data.recommendation,
      explanation: 'explanation' in v1Data && v1Data.explanation ? v1Data.explanation : v1Data.recommendation || '',
      confidence: {
        score: typeof v1Data.confidence === 'object' && typeof v1Data.confidence?.score === 'number'
          ? v1Data.confidence.score
          : typeof v1Data.confidence === 'number'
          ? v1Data.confidence
          : 0.8,
        explanation: typeof v1Data.confidence === 'object' && typeof v1Data.confidence?.explanation === 'string'
          ? v1Data.confidence.explanation
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
  // Handle confidence as object or number
  const confidenceObj = typeof data.confidence === 'object' && data.confidence !== null
    ? data.confidence
    : null;
  const confidenceScore = confidenceObj?.score ?? (typeof data.confidence === 'number' ? data.confidence : null);
  const confidenceExplanation = confidenceObj?.explanation ?? null;
  
  const isPlaceholder = 
    (confidenceScore === 0.0 && 
     (confidenceExplanation === "Decision not yet generated" || 
      ('explanation' in data && data.explanation === "The coach is still analyzing your training data. Recommendations will be available soon."))) ||
    ('explanation' in data && data.explanation === "The coach is still analyzing your training data. Recommendations will be available soon.") ||
    (confidenceExplanation === "Decision not yet generated");

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
    ? v2Decision.signals.slice(0, 3) // Max 3 signals
    : [];
  
  // Generate coach framing sentence based on decision type and primary focus
  const getCoachFraming = (): string => {
    // Use primary_focus if it contains context-aware messaging
    if (v2Decision.primary_focus) {
      const lowerFocus = v2Decision.primary_focus.toLowerCase();
      if (lowerFocus.includes('take the') || lowerFocus.includes('easy') || lowerFocus.includes('don\'t push')) {
        return 'Based on your recovery signals, proceed with today\'s workout but keep it easy.';
      }
      if (lowerFocus.includes('reduce intensity') || lowerFocus.includes('moderate')) {
        return 'Based on your current training state, adjust today\'s session intensity.';
      }
    }
    
    switch (decisionType) {
      case 'REST':
        return 'Based on your recent training and recovery signals, today is best used for recovery.';
      case 'MODIFY':
        return 'Based on your current training state, today\'s session should be adjusted.';
      case 'CANCEL':
        return 'Based on your recovery signals, today\'s session should be skipped.';
      case 'PROCEED':
        return 'Based on your recent training and recovery signals, you\'re ready to proceed with today\'s plan.';
      default:
        return 'Based on your training data, here\'s today\'s recommendation.';
    }
  };

  // Map signal text to icon and color
  const getSignalIcon = (signal: string): { icon: typeof TrendingUp; color: string } => {
    const lower = signal.toLowerCase();
    if (lower.includes('rest') || lower.includes('recovery') || lower.includes('fatigue') || lower.includes('elevated')) {
      return { icon: TrendingDown, color: 'text-amber-600 dark:text-amber-400' };
    }
    if (lower.includes('completed') || lower.includes('good') || lower.includes('ready') || lower.includes('strong')) {
      return { icon: TrendingUp, color: 'text-green-600 dark:text-green-400' };
    }
    return { icon: Activity, color: 'text-blue-600 dark:text-blue-400' };
  };

  return (
    <Card className={cn('h-full flex flex-col', className)}>
      {/* TODAY'S VERDICT Header Band */}
      <div className={cn('relative border-b', config.bgClass)}>
        <div className={cn('absolute left-0 top-0 bottom-0 w-1', config.accentStripClass)} />
        <CardHeader className="pb-3 pt-4 pl-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            TODAY'S VERDICT
          </div>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-lg', config.bgClass)}>
              <Icon className={cn('h-5 w-5', config.colorClass)} />
            </div>
            <div className={cn('text-2xl font-bold tracking-tight', config.colorClass)}>
              {config.displayLabel}
            </div>
          </div>
          <div className="text-xs font-medium mt-2 text-muted-foreground">
            {config.readinessLabel}
          </div>
        </CardHeader>
      </div>

      <CardContent className="flex-1 flex flex-col space-y-5 pt-5">
        {/* Coach Framing Sentence */}
        <p className="text-sm font-medium text-foreground leading-relaxed">
          {getCoachFraming()}
        </p>
        
        {/* Recovery Signals - as chips */}
        {signals.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              RECOVERY SIGNALS
            </div>
            <div className="flex flex-wrap gap-2">
              {signals.map((signal, index) => {
                const signalIcon = getSignalIcon(signal);
                const SignalIcon = signalIcon.icon;
                return (
                  <div
                    key={index}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs',
                      'bg-muted/50 border border-border',
                      signalIcon.color
                    )}
                  >
                    <SignalIcon className="h-3 w-3" />
                    <span>{signal}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Today's Focus - checklist tone */}
        {v2Decision.recommended_focus && v2Decision.recommended_focus.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              TODAY'S FOCUS
            </div>
            <ul className="space-y-2">
              {v2Decision.recommended_focus.map((item, index) => (
                <li key={index} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0">✔</span>
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
