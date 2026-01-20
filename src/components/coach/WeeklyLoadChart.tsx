import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeeklyLoad {
  week: string;
  level: 'low' | 'medium' | 'high';
  value: number;
}

interface WeeklyLoadChartProps {
  data: WeeklyLoad[];
}

type LoadLevel = 'low' | 'medium' | 'high';

const levelToBarColor: Record<LoadLevel, string> = {
  low: 'bg-blue-500',
  medium: 'bg-green-500',
  high: 'bg-amber-500',
};

const levelToTextClass: Record<LoadLevel, string> = {
  low: 'text-blue-600 dark:text-blue-400',
  medium: 'text-green-600 dark:text-green-400',
  high: 'text-amber-600 dark:text-amber-400',
};

/**
 * Weekly Training Load snapshot for Coach Dashboard
 * Shows relative load comparison for recent weeks
 */
export function WeeklyLoadChart({ data }: WeeklyLoadChartProps) {
  const getLevelLabel = (level: LoadLevel) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Training Load</CardTitle>
        <CardDescription>Relative load comparison</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((week) => (
          <div key={week.week} className="flex items-center gap-3">
            {/* Week label */}
            <span className="text-xs text-muted-foreground w-16 shrink-0">
              {week.week}
            </span>
            
            {/* Bar container */}
            <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden relative">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  levelToBarColor[week.level]
                )}
                style={{ width: `${(week.value / maxValue) * 100}%` }}
              />
            </div>
            
            {/* Level indicator */}
            <span className={cn('text-xs font-medium w-14 text-right', levelToTextClass[week.level])}>
              {getLevelLabel(week.level)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
