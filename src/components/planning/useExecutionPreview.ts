/**
 * Phase 6B: Execution Preview Hook
 * 
 * Manages execution preview state, conflict detection, and execution flow.
 * Frontend never mutates plans - backend is the single source of truth.
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { previewExecution, executePlan } from '@/lib/api/planningExecution';
import { trackEvent } from '@/lib/safe-analytics';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import type { WeekPlan, ExecutionPreviewResponse, ExecutionResponse } from '@/types/execution';

interface UseExecutionPreviewOptions {
  weekPlans: WeekPlan[];
  startDate: string;
  timezone: string;
  enabled?: boolean;
}

interface UseExecutionPreviewReturn {
  previewData: ExecutionPreviewResponse | undefined;
  isLoadingPreview: boolean;
  isExecuting: boolean;
  hasConflicts: boolean;
  conflicts: ExecutionPreviewResponse['conflicts'];
  checkConflicts: () => Promise<void>;
  execute: () => Promise<void>;
  error: Error | null;
}

export function useExecutionPreview({
  weekPlans,
  startDate,
  timezone,
  enabled = true,
}: UseExecutionPreviewOptions): UseExecutionPreviewReturn {
  const [error, setError] = useState<Error | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Preview query
  const {
    data: previewData,
    isLoading: isLoadingPreview,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ['executionPreview', weekPlans, startDate, timezone],
    queryFn: () => previewExecution(weekPlans, startDate, timezone),
    enabled: enabled && weekPlans.length > 0,
    retry: 1,
    onSuccess: () => {
      trackEvent('execution_preview_opened');
      setError(null);
    },
    onError: (err) => {
      const error = err as Error;
      setError(error);
      trackEvent('execution_failed', { error: error.message });
    },
  });

  // Execution mutation
  const executeMutation = useMutation({
    mutationFn: () => executePlan(weekPlans, startDate, timezone),
    onSuccess: (response: ExecutionResponse) => {
      trackEvent('execution_success', {
        sessions_created: response.sessions_created,
        weeks_affected: response.weeks_affected,
      });

      // Invalidate calendar queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['calendarWeek'] });
      queryClient.invalidateQueries({ queryKey: ['calendarSeason'] });
      queryClient.invalidateQueries({ queryKey: ['calendarToday'] });

      toast({
        title: 'Plan scheduled successfully',
        description: `${response.sessions_created || 0} sessions added to your calendar.`,
      });

      // Navigate to calendar view
      setTimeout(() => {
        navigate('/calendar');
      }, 1000);
    },
    onError: (err: Error) => {
      const error = err as { message?: string; status?: number };
      const errorMessage = error.message || 'Failed to execute plan. Please try again.';
      
      setError(new Error(errorMessage));
      trackEvent('execution_failed', {
        error: errorMessage,
        status: error.status,
      });

      toast({
        title: 'Execution failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const checkConflicts = useCallback(async () => {
    try {
      setError(null);
      await refetchPreview();
    } catch (err) {
      const error = err as Error;
      setError(error);
    }
  }, [refetchPreview]);

  const execute = useCallback(async () => {
    // Check for conflicts before executing
    if (previewData && previewData.conflicts.length > 0) {
      trackEvent('execution_blocked_conflict', {
        conflict_count: previewData.conflicts.length,
      });
      toast({
        title: 'Cannot execute',
        description: 'Please resolve conflicts before scheduling.',
        variant: 'destructive',
      });
      return;
    }

    trackEvent('execution_confirmed');
    await executeMutation.mutateAsync();
  }, [previewData, executeMutation]);

  const hasConflicts = (previewData?.conflicts.length ?? 0) > 0;
  const conflicts = previewData?.conflicts ?? [];

  return {
    previewData,
    isLoadingPreview,
    isExecuting: executeMutation.isPending,
    hasConflicts,
    conflicts,
    checkConflicts,
    execute,
    error,
  };
}
