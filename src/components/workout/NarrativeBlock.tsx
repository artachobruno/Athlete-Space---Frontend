import type { LLMFeedback } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NarrativeBlockProps {
  intentText?: string;
  executionSummary?: string;
  coachInsight?: { text: string; tone: 'warning' | 'encouragement' | 'neutral' };
  llmFeedback?: LLMFeedback | null;
  status: 'planned' | 'completed';
  isUnplanned?: boolean;
  isHeroSession?: boolean;
}

export function NarrativeBlock({
  intentText,
  executionSummary,
  coachInsight,
  llmFeedback,
  status,
  isUnplanned = false,
  isHeroSession = false,
}: NarrativeBlockProps) {
  const isCompleted = status === 'completed';

  return (
    <div className={isHeroSession ? "space-y-6" : "space-y-4"}>
      {/* Purpose section - always shown if intentText exists */}
      {intentText && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Purpose
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {intentText}
          </p>
        </div>
      )}

      {/* Outcome section - only for completed sessions with executionSummary */}
      {isCompleted && executionSummary && (
        <>
          {/* Unplanned indicator - only for completed unplanned sessions, shown above Outcome */}
          {isUnplanned && (
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              Unplanned Session
            </div>
          )}
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Outcome
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {executionSummary}
          </p>
        </div>
        </>
      )}

      {/* LLM Feedback section - shows after Outcome (if present) or after Purpose (if no Outcome) */}
      {/* PHASE: LLM-generated coaching feedback from execution summary */}
      {llmFeedback && (
        <div
          className={cn(
            "rounded-md px-3 py-2 text-sm",
            llmFeedback.tone === "encouraging" && "bg-green-500/10",
            llmFeedback.tone === "corrective" && "bg-yellow-500/10",
            llmFeedback.tone === "neutral" && "bg-muted/30"
          )}
        >
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Coach Feedback
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {llmFeedback.text}
          </p>
        </div>
      )}

      {/* Coach section - shows after LLM Feedback (if present) or after Outcome/Purpose */}
      {coachInsight && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Coach
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {coachInsight.text}
          </p>
        </div>
      )}
    </div>
  );
}
