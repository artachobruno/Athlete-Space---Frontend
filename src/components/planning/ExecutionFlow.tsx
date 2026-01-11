/**
 * Phase 6B: Execution Flow Component
 * 
 * Main component that orchestrates the execution preview, conflict detection,
 * and execution confirmation flow.
 * 
 * Frontend never mutates plans - backend is the single source of truth.
 */

import { useState, useEffect } from 'react';
import { ExecutionPreview } from './ExecutionPreview';
import { ExecutionConflicts } from './ExecutionConflicts';
import { ExecutionConfirmDialog } from './ExecutionConfirmDialog';
import { useExecutionPreview } from './useExecutionPreview';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { WeekPlan } from '@/types/execution';

interface ExecutionFlowProps {
  weekPlans: WeekPlan[];
  startDate: string;
  timezone: string;
  onAbort?: () => void;
}

export function ExecutionFlow({
  weekPlans,
  startDate,
  timezone,
  onAbort,
}: ExecutionFlowProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const {
    previewData,
    isLoadingPreview,
    isExecuting,
    hasConflicts,
    conflicts,
    checkConflicts,
    execute,
    error,
  } = useExecutionPreview({
    weekPlans,
    startDate,
    timezone,
    enabled: weekPlans.length > 0,
  });

  // Check for conflicts when component mounts or weekPlans change
  useEffect(() => {
    if (weekPlans.length > 0) {
      checkConflicts();
    }
  }, [weekPlans, checkConflicts]);

  const handleConfirmClick = () => {
    if (hasConflicts) {
      return; // Button should be disabled, but guard anyway
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmExecution = async () => {
    await execute();
    setShowConfirmDialog(false);
  };

  const handleAbort = () => {
    if (onAbort) {
      onAbort();
    }
  };

  if (weekPlans.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No plan to execute</AlertTitle>
        <AlertDescription>
          Please generate a plan before scheduling.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <ExecutionPreview
        weekPlans={weekPlans}
        startDate={startDate}
        timezone={timezone}
      />

      {/* Loading State */}
      {isLoadingPreview && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Checking for conflicts...
          </span>
        </div>
      )}

      {/* Conflicts */}
      {!isLoadingPreview && hasConflicts && (
        <ExecutionConflicts
          conflicts={conflicts}
          weekPlans={weekPlans}
        />
      )}

      {/* No Conflicts Status */}
      {!isLoadingPreview && !hasConflicts && previewData && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
          <AlertTitle className="text-green-900 dark:text-green-100">
            Ready to schedule
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            No conflicts detected. You can proceed with scheduling.
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleAbort}
          disabled={isExecuting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleConfirmClick}
          disabled={isLoadingPreview || hasConflicts || isExecuting}
          className="bg-primary hover:bg-primary/90"
        >
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scheduling...
            </>
          ) : (
            'Confirm & Schedule'
          )}
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <ExecutionConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        weekPlans={weekPlans}
        onConfirm={handleConfirmExecution}
        isLoading={isExecuting}
      />
    </div>
  );
}
