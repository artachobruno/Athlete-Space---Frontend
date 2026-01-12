import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProgressStage {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface CoachProgressListProps {
  stages: ProgressStage[];
}

export function CoachProgressList({ stages }: CoachProgressListProps) {
  const getStageIcon = (status: ProgressStage['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-load-fresh" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />;
      case 'pending':
      default:
        return <span className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />;
    }
  };

  return (
    <div className="mb-4 p-4 bg-accent/5 border border-accent/20 rounded-lg">
      <ul className="space-y-2" role="list">
        {stages.map((stage) => {
          const isInProgress = stage.status === 'in_progress';
          const isCompleted = stage.status === 'completed';

          return (
            <li
              key={stage.id}
              className={cn(
                'flex items-center gap-3 text-sm',
                isInProgress && 'font-medium',
                !isCompleted && !isInProgress && 'text-muted-foreground'
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
                {getStageIcon(stage.status)}
              </span>
              <span className={cn(
                'text-foreground',
                !isCompleted && !isInProgress && 'text-muted-foreground'
              )}>
                {stage.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
