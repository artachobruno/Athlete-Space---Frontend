import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { cn } from '@/lib/utils';

interface WeeklyLoad {
  week: string;
  level: 'low' | 'medium' | 'high';
  value: number;
}

interface WeeklyLoadChartProps {
  data: WeeklyLoad[];
}

// F1 Design: Map load levels to F1 status colors (flat, no gradients)
type LoadLevel = 'low' | 'medium' | 'high';

const levelToBarColor: Record<LoadLevel, string> = {
  low: 'bg-[hsl(var(--accent-telemetry))]',
  medium: 'bg-[hsl(var(--accent-success))]',
  high: 'bg-[hsl(var(--accent-warning))]',
};

const levelToTextClass: Record<LoadLevel, string> = {
  low: 'f1-status-active',
  medium: 'f1-status-safe',
  high: 'f1-status-caution',
};

/**
 * Weekly Training Load snapshot for Coach Dashboard
 * F1 Design: Instrument panel style with flat status colors
 * Shows relative load comparison for recent weeks
 */
export function WeeklyLoadChart({ data }: WeeklyLoadChartProps) {
  const getLevelLabel = (level: LoadLevel) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <F1Card>
      <F1CardHeader>
        <div>
          <F1CardTitle>Weekly Training Load</F1CardTitle>
          <F1CardLabel className="mt-1 block">Relative load comparison</F1CardLabel>
        </div>
      </F1CardHeader>
      
      <div className="space-y-3">
        {data.map((week) => (
          <div key={week.week} className="flex items-center gap-3">
            {/* Week label - mono font */}
            <span className="f1-label-md text-[hsl(var(--f1-text-tertiary))] w-16 shrink-0 font-mono">
              {week.week}
            </span>
            
            {/* Bar container - F1 style */}
            <div className="flex-1 h-6 bg-[var(--surface-glass-subtle)] rounded-f1-sm overflow-hidden relative">
              <div
                className={cn(
                  'h-full rounded-f1-sm transition-all duration-300',
                  levelToBarColor[week.level]
                )}
                style={{ width: `${(week.value / maxValue) * 100}%` }}
              />
            </div>
            
            {/* Level indicator - flat status color */}
            <span className={cn('f1-label-md w-14 text-right', levelToTextClass[week.level])}>
              {getLevelLabel(week.level)}
            </span>
          </div>
        ))}
      </div>
    </F1Card>
  );
}
