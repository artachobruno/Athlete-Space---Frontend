import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeIndicatorProps {
  label: string;
  className?: string;
}

export function SwipeIndicator({ label, className }: SwipeIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 py-1.5 text-[10px] text-muted-foreground/60',
        className
      )}
    >
      <div className="flex items-center gap-0.5 animate-pulse">
        <ChevronLeft className="h-3 w-3" />
        <ChevronLeft className="h-3 w-3 -ml-2" />
      </div>
      <span className="uppercase tracking-wider">Swipe for {label}</span>
      <div className="flex items-center gap-0.5 animate-pulse">
        <ChevronRight className="h-3 w-3" />
        <ChevronRight className="h-3 w-3 -ml-2" />
      </div>
    </div>
  );
}
