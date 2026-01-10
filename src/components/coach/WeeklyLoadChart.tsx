import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WeeklyLoad {
  week: string;
  level: 'low' | 'medium' | 'high';
  value: number;
}

interface WeeklyLoadChartProps {
  data: WeeklyLoad[];
}

/**
 * Weekly Training Load snapshot for Coach Dashboard
 * Shows relative load comparison for recent weeks
 */
export function WeeklyLoadChart({ data }: WeeklyLoadChartProps) {
  const getLevelColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-blue-500/80';
      case 'medium':
        return 'bg-primary/80';
      case 'high':
        return 'bg-orange-500/80';
    }
  };

  const getLevelLabel = (level: 'low' | 'medium' | 'high') => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Weekly Training Load</CardTitle>
        <p className="text-xs text-muted-foreground">Relative load comparison</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {data.map((week) => (
            <div key={week.week} className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground w-20 shrink-0">{week.week}</span>
              <div className="flex-1 h-8 bg-muted/30 rounded-md overflow-hidden relative">
                <div
                  className={cn(
                    'h-full rounded-md transition-all duration-500',
                    getLevelColor(week.level)
                  )}
                  style={{ width: `${(week.value / maxValue) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground w-16 text-right">
                {getLevelLabel(week.level)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
