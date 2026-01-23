import { Mountain, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import type { CompletedActivity } from '@/types';
import type { CalendarItem } from '@/types/calendar';

interface OverviewTabProps {
  execution?: {
    tss?: number | null;
    intensityFactor?: number | null;
    elevationGain?: number | null;
  };
  compliance?: 'complete' | 'partial' | 'missed';
  activity?: CompletedActivity | null;
}

export function OverviewTab({ execution, compliance, activity }: OverviewTabProps) {
  const { convertElevation } = useUnitSystem();

  // Get TSS from execution or activity
  const tss = execution?.tss ?? activity?.trainingLoad ?? null;
  
  // Get Intensity Factor from execution or activity
  const intensityFactor = execution?.intensityFactor ?? activity?.intensityFactor ?? null;
  
  // Get elevation from execution or activity
  const elevationGain = execution?.elevationGain ?? activity?.elevation ?? null;

  // Derive compliance signal text
  const complianceText = compliance === 'complete' 
    ? 'On target' 
    : compliance === 'partial' 
    ? 'Reduced volume' 
    : compliance === 'missed' 
    ? 'Missed session' 
    : null;

  return (
    <div className="space-y-4">
      {/* Load & Intensity (2-column) */}
      <div className="grid grid-cols-2 gap-3">
        {/* TSS / Load */}
        {tss !== null && tss > 0 && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground mb-1">TSS / Load</div>
            <div className="text-sm font-medium text-foreground">{Math.round(tss)}</div>
          </div>
        )}
        
        {/* Intensity Factor */}
        {intensityFactor !== null && intensityFactor !== undefined && (
          <div className={cn(
            "p-3 rounded-lg bg-muted/50",
            intensityFactor >= 1.0 && "ring-2 ring-load-overreaching/30"
          )}>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Intensity Factor
            </div>
            <div className={cn(
              "text-sm font-medium",
              intensityFactor >= 1.0 
                ? "text-load-overreaching" 
                : "text-foreground"
            )}>
              {intensityFactor.toFixed(2)}
            </div>
          </div>
        )}
      </div>

      {/* Elevation */}
      {elevationGain !== null && elevationGain !== undefined && elevationGain > 0 && (
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
            <Mountain className="h-3 w-3" />
            Elevation Gain
          </div>
          <div className="text-sm font-medium text-foreground">
            {(() => {
              const elev = convertElevation(elevationGain);
              return `${elev.value.toFixed(1)} ${elev.unit}`;
            })()}
          </div>
        </div>
      )}

      {/* Compliance Signal (text only) */}
      {complianceText && (
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="text-xs text-muted-foreground mb-1">Compliance</div>
          <div className="text-sm font-medium text-foreground">{complianceText}</div>
        </div>
      )}
    </div>
  );
}
