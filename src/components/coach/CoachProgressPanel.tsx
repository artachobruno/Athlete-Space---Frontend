import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Clock, AlertTriangle, SkipForward, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCoachProgress } from '@/lib/api/coach';
import { resolveStepStatus } from '@/utils/resolveStepStatus';
import type { CoachProgressResponse, StepStatus } from '@/types/coachProgress';
import { Button } from '@/components/ui/button';

type CoachMode = 'idle' | 'awaiting_intent' | 'planning' | 'executing' | 'done';

interface CoachProgressPanelProps {
  conversationId: string | null;
  mode?: CoachMode;
  onConfirm?: () => void;
  onComplete?: () => void;
}

// Preview checklist steps (read-only, what will happen)
const PREVIEW_CHECKLIST_STEPS = [
  { id: 'review', label: 'Review CTL / ATL / TSB' },
  { id: 'focus', label: 'Determine weekly focus' },
  { id: 'workouts', label: 'Plan key workouts' },
  { id: 'recovery', label: 'Insert recovery' },
];

export function CoachProgressPanel({ conversationId, mode = 'executing', onConfirm, onComplete }: CoachProgressPanelProps) {
  const [progress, setProgress] = useState<CoachProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionNotifiedRef = useRef(false);

  // Only fetch progress when executing (active conversation)
  useEffect(() => {
    if (!conversationId || mode !== 'executing') {
      // Clear any existing interval when not executing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsLoading(false);
      setProgress(null);
      setHasCompleted(false);
      completionNotifiedRef.current = false;
      return;
    }
    
    setIsLoading(true);

    const fetchProgress = async () => {
      try {
        const data = await fetchCoachProgress(conversationId);
        setProgress(data);
        setIsLoading(false);

        // Check if all steps are completed and stop polling
        const allCompleted = data.steps.length > 0 && data.steps.every((step) => {
          const status = resolveStepStatus(step.id, data.events);
          return status === 'completed' || status === 'failed' || status === 'skipped';
        });

        if (allCompleted) {
          setHasCompleted(true);
          
          // Stop polling
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          // Notify parent of completion (only once)
          if (!completionNotifiedRef.current && onComplete) {
            completionNotifiedRef.current = true;
            onComplete();
          }
        }
      } catch (error) {
        console.error('[CoachProgressPanel] Failed to fetch progress:', error);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchProgress();

    // Poll every 1.5-2s (using 1750ms as a middle ground)
    intervalRef.current = setInterval(() => {
      fetchProgress();
    }, 1750);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [conversationId, mode, onComplete]);

  // Show preview checklist when in planning mode
  if (mode === 'planning') {
    return (
      <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            Proposed Weekly Planning Steps
          </h3>
          <p className="text-xs text-muted-foreground">
            Review and confirm before generating your plan.
          </p>
        </div>
        <ul className="space-y-2 mb-4" role="list">
          {PREVIEW_CHECKLIST_STEPS.map((step) => (
            <li
              key={step.id}
              className="flex items-center gap-3 text-sm text-muted-foreground"
            >
              <span className="flex items-center justify-center shrink-0" aria-hidden="true">
                <Square className="h-4 w-4 text-muted-foreground/50" />
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ul>
        {onConfirm && (
          <Button
            onClick={onConfirm}
            className="w-full bg-coach hover:bg-coach/90 text-coach-foreground"
          >
            Generate Weekly Plan
          </Button>
        )}
      </div>
    );
  }

  // Hide when not executing or when completed
  if (mode !== 'executing' || hasCompleted) {
    return null;
  }

  // Show loading state while fetching initial progress
  if (isLoading && !progress) {
    return (
      <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Initializing training plan...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show empty/initializing state if no steps yet
  if (!progress || progress.steps.length === 0) {
    return (
      <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Preparing your training plan...</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-load-fresh" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'skipped':
        return <SkipForward className="h-4 w-4 text-muted-foreground" />;
      case 'planned':
      default:
        return <Square className="h-4 w-4 text-muted-foreground/50" />;
    }
  };

  const getStatusLabel = (status: StepStatus) => {
    switch (status) {
      case 'in_progress':
        return 'in progress';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'skipped':
        return 'skipped';
      case 'planned':
      default:
        return 'planned';
    }
  };

  return (
    <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
      <ul className="space-y-2" role="list">
        {progress.steps.map((step) => {
          const status = resolveStepStatus(step.id, progress.events);
          const isInProgress = status === 'in_progress';

          return (
            <li
              key={step.id}
              className={cn(
                'flex items-center gap-3 text-sm',
                isInProgress && 'font-medium'
              )}
              aria-busy={isInProgress}
            >
              <span
                className={cn(
                  'flex items-center justify-center shrink-0',
                  isInProgress && 'animate-pulse'
                )}
                aria-hidden="true"
              >
                {getStatusIcon(status)}
              </span>
              <span className="text-foreground">
                {step.label}
                <span className="sr-only"> - {getStatusLabel(status)}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
