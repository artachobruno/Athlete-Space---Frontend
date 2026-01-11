/**
 * Phase 6B: Execution Confirmation Dialog
 * 
 * Confirmation gate before executing the plan.
 * User must explicitly confirm before backend executes.
 */

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { WeekPlan } from '@/types/execution';

interface ExecutionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekPlans: WeekPlan[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ExecutionConfirmDialog({
  open,
  onOpenChange,
  weekPlans,
  onConfirm,
  isLoading = false,
}: ExecutionConfirmDialogProps) {
  // Calculate summary counts
  const totalSessions = weekPlans.reduce((sum, week) => sum + week.sessions.length, 0);
  const weeksAffected = weekPlans.length;

  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Confirm & Schedule</DialogTitle>
          <DialogDescription>
            Review the summary before scheduling sessions to your calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sessions to be written:</span>
              <span className="font-medium">{totalSessions}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weeks affected:</span>
              <span className="font-medium">{weeksAffected}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Important
                </p>
                <p className="text-yellow-800 dark:text-yellow-200">
                  This will add sessions to your calendar. Existing sessions will not be modified.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              'Confirm & Schedule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
