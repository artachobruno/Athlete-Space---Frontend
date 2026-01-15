import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SlaBarProps {
  value: number;
  threshold: number;
}

/**
 * SLA compliance progress bar with threshold marker
 * Shows current SLA percentage and whether it meets the target
 */
export function SlaBar({ value, threshold }: SlaBarProps) {
  const isAboveThreshold = value >= threshold;
  
  // Calculate position for threshold marker (scale 99-100 to 0-100)
  const thresholdPosition = ((threshold - 99) / 1) * 100;
  const valuePosition = ((value - 99) / 1) * 100;

  return (
    <GlassCard>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">SLA Compliance</CardTitle>
          <span className={cn(
            'text-lg font-semibold',
            isAboveThreshold ? 'text-green-600' : 'text-amber-500'
          )}>
            {value}%
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Progress bar container */}
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            {/* Progress fill */}
            <div 
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isAboveThreshold ? 'bg-green-500' : 'bg-amber-500'
              )}
              style={{ width: `${Math.min(valuePosition, 100)}%` }}
            />
            
            {/* Threshold marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-foreground/60"
              style={{ left: `${thresholdPosition}%` }}
            />
          </div>

          {/* Labels */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>99.0%</span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-0.5 bg-foreground/60" />
              Threshold: {threshold}%
            </span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </GlassCard>
  );
}
