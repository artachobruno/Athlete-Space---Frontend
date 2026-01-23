interface NarrativeBlockProps {
  intentText?: string;
  executionSummary?: string;
  coachInsight?: { text: string; tone: 'warning' | 'encouragement' | 'neutral' };
  status: 'planned' | 'completed';
  isUnplanned?: boolean;
  isHeroSession?: boolean;
}

export function NarrativeBlock({
  intentText,
  executionSummary,
  coachInsight,
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

      {/* Coach section - shows after Outcome (if present) or after Purpose (if no Outcome) */}
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
