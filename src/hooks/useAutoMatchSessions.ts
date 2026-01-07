import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchActivities, fetchCalendarWeek, updateSessionStatus, type CalendarSession } from '@/lib/api';
import { matchActivityToSession } from '@/lib/session-utils';
import { toast } from '@/hooks/use-toast';
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
        const sessions = weekData?.sessions || [];

        // Filter to only planned sessions
        const plannedSessions = sessions.filter(
          (s: CalendarSession) => s.status === 'planned'
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
        for (const { activity, sessionId } of matches) {
          try {
            await updateSessionStatus(sessionId, 'completed', activity.id);
            console.log(`[AutoMatch] Matched activity ${activity.id} to session ${sessionId}`);
          } catch (error) {
            console.error(`[AutoMatch] Failed to update session ${sessionId}:`, error);
          }
        }

        // Invalidate calendar queries to refresh
        if (matches.length > 0) {
          await queryClient.invalidateQueries({ queryKey: ['calendarWeek'] });
          await queryClient.invalidateQueries({ queryKey: ['calendarSeason'] });
          await queryClient.invalidateQueries({ queryKey: ['calendarToday'] });
          
          toast({
            title: 'Sessions updated',
            description: `Matched ${matches.length} activity${matches.length > 1 ? 'ies' : ''} to planned sessions`,
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

