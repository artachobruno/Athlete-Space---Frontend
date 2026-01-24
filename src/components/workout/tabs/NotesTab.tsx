import type { CalendarSession } from '@/lib/api';
import type { CompletedActivity } from '@/types';

interface NotesTabProps {
  session?: CalendarSession | null;
  activity?: CompletedActivity | null;
}

export function NotesTab({ session, activity }: NotesTabProps) {
  // Get athlete notes from session (activity doesn't have notes property)
  const athleteNotes = session?.notes || null;

  // Get coach notes from session
  const coachNotes = session?.coach_insight ? [session.coach_insight] : [];

  const hasAnyNotes = athleteNotes || coachNotes.length > 0;

  if (!hasAnyNotes) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No notes available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Athlete Notes */}
      {athleteNotes && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Athlete Notes
          </div>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {athleteNotes}
          </p>
        </div>
      )}

      {/* Coach Notes */}
      {coachNotes.length > 0 && (
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Coach Notes
          </div>
          <div className="space-y-3">
            {coachNotes.map((note, index) => (
              <div key={index} className="text-sm text-foreground leading-relaxed">
                {note}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
