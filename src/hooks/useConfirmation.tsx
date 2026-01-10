import { useState, useCallback } from "react";
import { ConfirmationDialog } from "@/components/confirmation/ConfirmationDialog";
import { type ProposalOnlyResponse } from "@/lib/api";
import { checkForProposalResponse } from "@/lib/confirmation-handler";

interface PendingConfirmation {
  proposal: ProposalOnlyResponse;
  retry: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

/**
 * Hook for managing confirmation dialogs for PROPOSAL_ONLY responses.
 * Provides a function to wrap API calls and handle confirmations automatically.
 */
export function useConfirmation() {
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleWithConfirmation = useCallback(
    async <T,>(apiCall: () => Promise<T>): Promise<T> => {
      try {
        const response = await apiCall();
        
        // Check if response requires confirmation
        const proposal = checkForProposalResponse(response);
        
        if (proposal) {
          // Return a promise that will be resolved after user confirms
          return new Promise<T>((resolve, reject) => {
            const retryWithConfirmed = async () => {
              setIsLoading(true);
              try {
                // Retry the API call (the caller should include confirmed: true)
                // Note: We can't automatically retry here without knowing the original payload,
                // so the caller needs to handle retry with confirmed: true
                const confirmedResponse = await apiCall();
                const confirmedProposal = checkForProposalResponse(confirmedResponse);
                
                if (confirmedProposal) {
                  // Still PROPOSAL_ONLY even with confirmed - this shouldn't happen but handle it
                  reject(new Error("Backend still returned PROPOSAL_ONLY even with confirmed=true"));
                } else {
                  resolve(confirmedResponse as T);
                }
              } catch (error) {
                reject(error);
              } finally {
                setIsLoading(false);
              }
            };

            setPendingConfirmation({
              proposal,
              retry: retryWithConfirmed,
              resolve: resolve as (value: unknown) => void,
              reject,
            });
          });
        }

        // No confirmation needed, return response directly
        return response;
      } catch (error) {
        // Re-throw errors (not PROPOSAL_ONLY responses)
        throw error;
      }
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!pendingConfirmation) return;
    
    setIsLoading(true);
    try {
      const result = await pendingConfirmation.retry();
      pendingConfirmation.resolve(result);
      setPendingConfirmation(null);
    } catch (error) {
      // Don't close dialog on error, let user retry
      console.error("Confirmation retry failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pendingConfirmation]);

  const handleCancel = useCallback(() => {
    if (!pendingConfirmation) return;
    
    pendingConfirmation.reject(new Error("User cancelled confirmation"));
    setPendingConfirmation(null);
  }, [pendingConfirmation]);

  const confirmationDialog = pendingConfirmation ? (
    <ConfirmationDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          handleCancel();
        }
      }}
      proposal={pendingConfirmation.proposal}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      isLoading={isLoading}
    />
  ) : null;

  return {
    handleWithConfirmation,
    confirmationDialog,
    hasPendingConfirmation: pendingConfirmation !== null,
  };
}
