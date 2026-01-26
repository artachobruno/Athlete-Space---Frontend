/**
 * Weekly Summary Card
 * 
 * PHASE A + B: Backend-derived execution summary with templated narrative.
 * Renders above the week grid, showing execution summary from execution summaries.
 * 
 * Design rules:
 * - Muted background
 * - No icons, no emojis
 * - Calm typography
 * - Optional click-through to strongest session
 */

import type { WeeklySummaryCard as Summary } from '@/types/calendar';

interface WeeklySummaryCardProps {
  summary: Summary;
  onOpenSession?: (sessionId: string) => void;
}

export function WeeklySummaryCard({ summary, onOpenSession }: WeeklySummaryCardProps) {
  // Hide card when it adds no value (empty week)
  if (
    summary.total_planned_sessions === 0 &&
    summary.unplanned_sessions_count === 0
  ) {
    return null;
  }

  return (
    <div className="rounded-xl bg-muted/30 px-4 py-3 mb-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        Weekly Summary
      </div>

      <div className="text-sm text-foreground leading-relaxed">
        {summary.narrative}
      </div>

      {summary.strongest_session_id && onOpenSession && (
        <button
          onClick={() => onOpenSession(summary.strongest_session_id!)}
          className="mt-2 text-xs text-muted-foreground hover:text-foreground transition"
        >
          View strongest session →
        </button>
      )}
    </div>
  );
}
