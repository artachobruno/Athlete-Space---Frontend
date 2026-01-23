/**
 * Weekly Narrative Card
 * 
 * Synthesizes the week and guides attention.
 * Answers: "What is this week about, and what matters most?"
 */

import { Card, CardContent } from '@/components/ui/card';
import type { CalendarSession } from '@/lib/api';
import { deriveWeeklyNarrative } from '@/utils/deriveWeeklyNarrative';

interface WeeklyNarrativeCardProps {
  weekStart: string;
  sessions: CalendarSession[];
  onKeySessionClick?: (sessionId: string) => void;
}

export function WeeklyNarrativeCard({
  weekStart,
  sessions,
  onKeySessionClick,
}: WeeklyNarrativeCardProps) {
  const narrative = deriveWeeklyNarrative(sessions);

  const handleKeySessionClick = () => {
    if (narrative.focusSessionId && onKeySessionClick) {
      onKeySessionClick(narrative.focusSessionId);
    }
  };

  return (
    <Card className="border-border/60 bg-muted/30">
      <CardContent className="p-4">
        {/* Title */}
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          This Week
        </div>

        {/* Narrative text */}
        <p className="text-sm text-foreground leading-relaxed mb-3">
          {narrative.summary}
        </p>

        {/* Key session line (optional) */}
        {narrative.keySessionTitle && (
          <div className="text-xs text-muted-foreground">
            <span className="opacity-70">Key session: </span>
            {narrative.focusSessionId && onKeySessionClick ? (
              <button
                onClick={handleKeySessionClick}
                className="underline hover:text-foreground transition-colors"
              >
                {narrative.keySessionTitle}
              </button>
            ) : (
              <span>{narrative.keySessionTitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
