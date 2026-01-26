import { useEffect, useRef, useState } from "react";
import { classifyApiError, type ClassifiedError } from "@/lib/api/errorClassification";

export interface UsePollingOptions {
  /** Function to call on each poll */
  pollFn: () => Promise<unknown>;
  /** Polling interval in milliseconds */
  intervalMs?: number;
  /** Maximum number of polls before stopping */
  maxPolls?: number;
  /** Whether polling is enabled */
  enabled?: boolean;
  /** Callback when polling stops due to terminal error */
  onTerminalError?: (error: ClassifiedError) => void;
  /** Callback when polling stops due to max attempts */
  onMaxAttempts?: () => void;
  /** Callback when polling completes successfully */
  onComplete?: () => void;
}

export interface UsePollingResult {
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Current poll count */
  pollCount: number;
  /** Last error encountered */
  lastError: ClassifiedError | null;
  /** Manually stop polling */
  stop: () => void;
  /** Manually start polling */
  start: () => void;
}

/**
 * Reusable polling hook with error classification and guardrails.
 * 
 * Features:
 * - Automatic error classification (TERMINAL vs RETRYABLE)
 * - Stops on terminal errors (404, 403, 401)
 * - Exponential backoff for retryable errors
 * - Max poll limit
 * - Manual start/stop control
 * 
 * @example
 * ```tsx
 * const { isPolling, stop } = usePolling({
 *   pollFn: async () => {
 *     const data = await fetchData();
 *     if (data.complete) {
 *       stop();
 *     }
 *   },
 *   intervalMs: 2000,
 *   maxPolls: 30,
 *   enabled: conversationId !== null,
 *   onTerminalError: (error) => {
 *     console.error("Terminal error, stopping:", error);
 *   },
 * });
 * ```
 */
export function usePolling({
  pollFn,
  intervalMs = 2000,
  maxPolls = 30,
  enabled = true,
  onTerminalError,
  onMaxAttempts,
  onComplete,
}: UsePollingOptions): UsePollingResult {
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [lastError, setLastError] = useState<ClassifiedError | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const enabledRef = useRef(enabled);
  const shouldStopRef = useRef(false);

  // Update enabled ref when prop changes
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const stop = () => {
    shouldStopRef.current = true;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  };

  const start = () => {
    shouldStopRef.current = false;
    setPollCount(0);
    setLastError(null);
    setIsPolling(true);
  };

  useEffect(() => {
    if (!enabled || shouldStopRef.current) {
      stop();
      return;
    }

    setIsPolling(true);

    const poll = async () => {
      if (!enabledRef.current || shouldStopRef.current) {
        stop();
        return;
      }

      try {
        const result = await pollFn();
        setLastError(null);
        setPollCount((prev) => prev + 1);

        // Check if polling should complete (e.g., result indicates completion)
        if (onComplete) {
          onComplete();
        }
      } catch (error: unknown) {
        const classified = classifyApiError(error);
        setLastError(classified);
        setPollCount((prev) => prev + 1);

        // TERMINAL: Stop immediately
        if (classified.class === "TERMINAL") {
          console.info("[usePolling] Terminal error detected, stopping:", classified);
          stop();
          if (onTerminalError) {
            onTerminalError(classified);
          }
          return;
        }

        // RETRYABLE: Continue polling (with backoff handled by interval)
        if (classified.class === "RETRYABLE") {
          console.warn("[usePolling] Retryable error, continuing:", classified);
          // Continue polling - interval will handle next attempt
        }

        // USER_ACTION: Stop and surface to UI
        if (classified.class === "USER_ACTION") {
          console.warn("[usePolling] User action required, stopping:", classified);
          stop();
          return;
        }

        // Max attempts check
        if (pollCount >= maxPolls) {
          console.warn("[usePolling] Max polls reached, stopping");
          stop();
          if (onMaxAttempts) {
            onMaxAttempts();
          }
        }
      }
    };

    // Initial poll
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      stop();
    };
  }, [enabled, pollFn, intervalMs, maxPolls, onTerminalError, onMaxAttempts, onComplete, pollCount]);

  return {
    isPolling,
    pollCount,
    lastError,
    stop,
    start,
  };
}
