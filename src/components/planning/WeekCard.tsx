/**
 * Phase 7: Week Card Component
 * 
 * Expandable week-by-week display with session list.
 * Collapsed by default, expands to show sessions.
 */

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SessionCard } from './SessionCard';
import type { PlanSession } from '@/types/execution';

interface WeekCardProps {
  weekIndex: number;
  sessions: PlanSession[];
  totals: {
    durationMin: number;
    distanceMiles: number;
  };
}

/**
 * Converts minutes to hours and minutes for display
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

export function WeekCard({ weekIndex, sessions, totals }: WeekCardProps) {
  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const sessionCount = sessions.length;
  const durationDisplay = formatDuration(totals.durationMin);
  const distanceDisplay = totals.distanceMiles.toFixed(1);

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={`week-${weekIndex}`} className="border rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center justify-between w-full pr-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-base">Week {weekIndex}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{sessionCount} sessions</span>
              <span>•</span>
              <span>{durationDisplay}</span>
              <span>•</span>
              <span>{distanceDisplay} mi</span>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-3 pt-2">
            {sortedSessions.map((session) => (
              <SessionCard key={session.session_id} session={session} />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
