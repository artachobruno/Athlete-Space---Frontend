import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivities, fetchCalendarWeek, updateSessionStatus, type CalendarSession } from '@/lib/api';
import { matchActivityToSession } from '@/lib/session-utils';
import { toast } from '@/hooks/use-toast';
import { checkForProposalResponse } from '@/lib/confirmation-handler';
import type { CompletedActivity } from '@/types';

/**
 * Module-level timestamp tracking last drag operation.
 * Prevents auto-match from running immediately after drag operations.
 */
let lastDragOperationTime = 0;
const DRAG_COOLDOWN_MS = 5000; // 5 seconds cooldown after drag

/**
 * Called by drag handlers to mark that a drag operation just completed.
 * This prevents useAutoMatchSessions from interfering with drag operations.
 */
export function markDragOperationComplete() {
  lastDragOperationTime = Date.now();
}

/**
 * Hook that automatically matches completed activities to planned sessions.
 * Runs when activities are fetched and marks matching sessions as completed.
 * 
 * CRITICAL: Skips execution if a drag operation completed recently to prevent
 * calendar from snapping back after drag-and-drop.
 */
export function useAutoMatchSessions(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const { data: activities } = useQuery({
    queryKey: ['activities', 'limit', 100],
    queryFn: () => fetchActivities({ limit: 100 }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!enabled || !activities || activities.length === 0) return;

    // CRITICAL: Skip auto-match if a drag operation completed recently
    // This prevents calendar from snapping back after drag-and-drop
    const timeSinceLastDrag = Date.now() - lastDragOperationTime;
    if (timeSinceLastDrag < DRAG_COOLDOWN_MS) {
      const remainingCooldown = Math.ceil((DRAG_COOLDOWN_MS - timeSinceLastDrag) / 1000);
      console.log(`[AutoMatch] Skipping: drag operation completed ${remainingCooldown}s ago (cooldown: ${DRAG_COOLDOWN_MS / 1000}s)`);
      // Effect will naturally re-run when activities change after cooldown expires
      return;
    }

    const autoMatch = async () => {
      try {
        // Get current week's sessions
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const weekData = await fetchCalendarWeek(weekStartStr);
        const sessions = Array.isArray(weekData?.sessions) ? weekData.sessions : [];

        // FE-3: Remove invalid filters - filter sessions that aren't explicitly excluded
        const plannedSessions = sessions.filter(
          (s: CalendarSession) => s.status !== 'completed' && s.status !== 'deleted' && s.status !== 'skipped'
        ) as CalendarSession[];

        if (plannedSessions.length === 0) return;

        // Match activities to sessions
        const matches: Array<{ activity: CompletedActivity; sessionId: string }> = [];

        for (const activity of activities) {
          const sessionId = matchActivityToSession(activity, plannedSessions, 0); // Same day only
          if (sessionId) {
            matches.push({ activity, sessionId });
          }
        }

        // Update matched sessions
        const successfulMatches: Array<{ activity: CompletedActivity; sessionId: string }> = [];
        const needsConfirmation: Array<{ activity: CompletedActivity; sessionId: string }> = [];
        
        for (const { activity, sessionId } of matches) {
          try {
            const response = await updateSessionStatus(sessionId, 'completed', activity.id);
            
            // Check if response requires confirmation (PROPOSAL_ONLY)
            const proposal = checkForProposalResponse(response);
            
            if (proposal) {
              // F-CONF-3: No UI-side auto-confirm for auto-matching
              // Skip auto-confirmation and log for manual handling
              console.warn(`[AutoMatch] Session ${sessionId} requires confirmation (PROPOSAL_ONLY). Skipping auto-match.`);
              needsConfirmation.push({ activity, sessionId });
            } else {
              // Success - no confirmation needed
              successfulMatches.push({ activity, sessionId });
              console.log(`[AutoMatch] Matched activity ${activity.id} to session ${sessionId}`);
            }
          } catch (error) {
            console.error(`[AutoMatch] Failed to update session ${sessionId}:`, error);
          }
        }

        // Invalidate all calendar queries to refresh
        // CRITICAL: Must invalidate all calendar query keys including month queries
        if (successfulMatches.length > 0) {
          // Invalidate only active view queries (not season to prevent OOM refetch storms)
          await queryClient.invalidateQueries({ queryKey: ['calendarWeek'], exact: false });
          await queryClient.invalidateQueries({ queryKey: ['calendar', 'month'], exact: false });
          await queryClient.invalidateQueries({ queryKey: ['calendarToday'], exact: false });
          await queryClient.invalidateQueries({ queryKey: ['calendarRange'], exact: false });
          
          let description = `Matched ${successfulMatches.length} activity${successfulMatches.length > 1 ? 'ies' : ''} to planned sessions`;
          if (needsConfirmation.length > 0) {
            description += `. ${needsConfirmation.length} session${needsConfirmation.length > 1 ? 's' : ''} require${needsConfirmation.length > 1 ? '' : 's'} manual confirmation.`;
          }
          
          toast({
            title: 'Sessions updated',
            description,
          });
        } else if (needsConfirmation.length > 0) {
          // All matches need confirmation
          toast({
            title: 'Confirmation required',
            description: `${needsConfirmation.length} session${needsConfirmation.length > 1 ? 's' : ''} require${needsConfirmation.length > 1 ? '' : 's'} your confirmation. Please update them manually.`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('[AutoMatch] Error during auto-matching:', error);
      }
    };

    // Debounce auto-matching to avoid too many API calls
    // Note: This debounce is in addition to the drag cooldown check above
    const timeoutId = setTimeout(autoMatch, 2000);
    return () => clearTimeout(timeoutId);
  }, [activities, enabled, queryClient]);
}

