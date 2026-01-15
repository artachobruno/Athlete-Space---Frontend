import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { type ProposalOnlyResponse } from "@/lib/api";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposal: ProposalOnlyResponse;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  proposal,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Confirmation failed:", error);
      // Keep dialog open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const actionText =
    proposal.action === "create"
      ? "create"
      : proposal.action === "modify"
        ? "modify"
        : "delete";

  const resourceText =
    proposal.resource_type === "session"
      ? "session"
      : proposal.resource_type === "week"
        ? "week"
        : "season";

  // Format diff changes for display
  const renderDiff = () => {
    if (!proposal.diff) return null;

    if (proposal.diff.changes && Array.isArray(proposal.diff.changes)) {
      return (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Changes:</h4>
          <div className="space-y-1 max-h-[200px] overflow-y-auto rounded-md border p-3 bg-muted/50">
            {proposal.diff.changes.map((change, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">{change.field}:</span>{" "}
                <span className="text-muted-foreground line-through">
                  {String(change.before ?? "—")}
                </span>{" "}
                →{" "}
                <span className="text-foreground font-medium">
                  {String(change.after ?? "—")}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (proposal.diff.before && proposal.diff.after) {
      return (
        <div className="space-y-2">
          <div className="rounded-md border p-3 bg-muted/50">
            <h4 className="text-sm font-semibold mb-2">Before:</h4>
            <pre className="text-xs text-muted-foreground overflow-auto">
              {JSON.stringify(proposal.diff.before, null, 2)}
            </pre>
          </div>
          <div className="rounded-md border p-3 bg-muted/50">
            <h4 className="text-sm font-semibold mb-2">After:</h4>
            <pre className="text-xs text-foreground overflow-auto">
              {JSON.stringify(proposal.diff.after, null, 2)}
            </pre>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none sm:max-w-[600px]">
        <GlassCard variant="raised" className="rounded-2xl">
          <div className="p-6">
        <DialogHeader>
          <DialogTitle>Confirm {actionText.charAt(0).toUpperCase() + actionText.slice(1)} {resourceText}</DialogTitle>
          <DialogDescription>
            {proposal.message || `I'm about to ${actionText} this ${resourceText}. Should I proceed?`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {proposal.summary && (
            <div className="rounded-md border p-3 bg-muted/30">
              <p className="text-sm text-foreground">{proposal.summary}</p>
            </div>
          )}

          {renderDiff()}

          <div className="rounded-md border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> This is a proposal only — not applied. No changes will be made until you explicitly confirm.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? "Confirming..." : "Confirm & Proceed"}
          </Button>
        </DialogFooter>
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
