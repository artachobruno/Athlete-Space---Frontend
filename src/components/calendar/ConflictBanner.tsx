/**
 * ConflictBanner component (A86.6 - UI surfacing)
 * 
 * Displays conflicts returned by backend API.
 * No conflict detection logic - just display + action buttons.
 */
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import type { Conflict } from '@/lib/conflicts';
import { format } from 'date-fns';

interface ConflictBannerProps {
  conflicts: Conflict[];
  onDismiss?: () => void;
  onAutoResolve?: () => void;
  onManualReview?: () => void;
  showActions?: boolean;
  existingSessionTitles?: Record<string, string>;
  candidateSessionTitles?: Record<string, string>;
}

export function ConflictBanner({
  conflicts,
  onDismiss,
  onAutoResolve,
  onManualReview,
  showActions = true,
  existingSessionTitles = {},
  candidateSessionTitles = {},
}: ConflictBannerProps) {
  if (conflicts.length === 0) {
    return null;
  }

  const getReasonText = (reason: Conflict['reason']): string => {
    switch (reason) {
      case 'time_overlap':
        return 'Time overlap';
      case 'all_day_overlap':
        return 'All-day session conflict';
      case 'multiple_key_sessions':
        return 'Multiple key sessions (workout/long) on same day';
      default:
        return 'Conflict';
    }
  };

  return (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">
        Calendar Conflicts Detected
      </AlertTitle>
      <AlertDescription className="text-amber-800 dark:text-amber-200 space-y-3">
        <p>
          We found {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} in your calendar. 
          Please resolve them before saving.
        </p>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {conflicts.map((conflict, index) => (
            <div key={index} className="text-sm border-l-2 border-amber-400 pl-2 py-1">
              <div className="font-medium">
                {format(new Date(conflict.date), 'MMM d, yyyy')}: {getReasonText(conflict.reason)}
              </div>
              <div className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                <div>Existing session: {existingSessionTitles[conflict.existing_session_id] || conflict.existing_session_id}</div>
                <div>New session: {candidateSessionTitles[conflict.candidate_session_id] || conflict.candidate_session_id}</div>
              </div>
            </div>
          ))}
        </div>

        {showActions && (
          <div className="flex gap-2 pt-2">
            {onAutoResolve && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAutoResolve}
                className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                Auto-resolve
              </Button>
            )}
            {onManualReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={onManualReview}
                className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                Review manually
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
