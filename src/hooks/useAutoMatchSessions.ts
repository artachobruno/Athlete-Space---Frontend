import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivities, fetchCalendarWeek, updateSessionStatus, type CalendarSession } from '@/lib/api';
import { matchActivityToSession } from '@/lib/session-utils';
import { toast } from '@/hooks/use-toast';
import { checkForProposalResponse } from '@/lib/confirmation-handler';
import type { CompletedActivity } from '@/types';

/**
 * Hook that automatically matches completed activities to planned sessions.
 * Runs when activities are fetched and marks matching sessions as completed.
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
          (s: CalendarSession) => s.status !== 'completed' && s.status !== 'cancelled' && s.status !== 'skipped'
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
          await queryClient.invalidateQueries({ queryKey: ['calendar'], exact: false });
          await queryClient.invalidateQueries({ queryKey: ['calendarWeek'], exact: false });
          await queryClient.invalidateQueries({ queryKey: ['calendarSeason'], exact: false });
          await queryClient.invalidateQueries({ queryKey: ['calendarToday'], exact: false });
          
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
    const timeoutId = setTimeout(autoMatch, 2000);
    return () => clearTimeout(timeoutId);
  }, [activities, enabled, queryClient]);
}

