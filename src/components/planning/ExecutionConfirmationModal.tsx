/**
 * Phase 7: Execution Confirmation Modal (MANDATORY)
 * 
 * Confirmation gate before executing the plan.
 * User must explicitly confirm with checkbox before backend executes.
 * This is different from Phase 6B ExecutionConfirmDialog - this one requires a checkbox.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { WeekPlan } from '@/types/execution';

interface ExecutionConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: WeekPlan[];
  onConfirm: () => void;
  isExecuting?: boolean;
}

export function ExecutionConfirmationModal({
  open,
  onOpenChange,
  plans,
  onConfirm,
  isExecuting = false,
}: ExecutionConfirmationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Calculate summary counts
  const totalSessions = plans.reduce(
    (sum, week) => sum + week.sessions.length,
    0
  );

  const handleConfirm = () => {
    if (isConfirmed && !isExecuting) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isExecuting) {
      setIsConfirmed(false);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isExecuting) {
      setIsConfirmed(false);
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule training plan?</DialogTitle>
          <DialogDescription>
            Review the summary before scheduling sessions to your calendar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary */}
          <div className="bg-accent/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Sessions to be added:
              </span>
              <span className="font-medium">{totalSessions}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1 flex-1">
                <p className="font-medium text-yellow-900 dark:text-yellow-100">
                  Important
                </p>
                <p className="text-yellow-800 dark:text-yellow-200">
                  This will add <strong>{totalSessions} sessions</strong> to
                  your calendar.
                </p>
                <p className="text-yellow-800 dark:text-yellow-200">
                  Existing sessions will not be modified.
                </p>
                <p className="text-yellow-800 dark:text-yellow-200">
                  Conflicts will be flagged before scheduling.
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox (Required) */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="confirmation-checkbox"
              checked={isConfirmed}
              onCheckedChange={(checked) => setIsConfirmed(checked === true)}
              disabled={isExecuting}
            />
            <Label
              htmlFor="confirmation-checkbox"
              className="text-sm font-normal leading-5 cursor-pointer"
            >
              I understand this will add sessions to my calendar
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isExecuting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmed || isExecuting}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
