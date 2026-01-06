import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockWeeklyPlan, mockTrainingLoad } from '@/lib/mock-data';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { subDays, format } from 'date-fns';

export function WeeklyLoadCard() {
  const today = new Date();
  
  // Get last 7 days of training load
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const loadEntry = mockTrainingLoad.find(l => l.date === dateStr);
    
    return {
      day: format(date, 'EEE'),
      load: loadEntry?.dailyLoad || 0,
      isToday: i === 6,
    };
  });

  const progress = (mockWeeklyPlan.actualLoad / mockWeeklyPlan.plannedLoad) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Weekly Load</CardTitle>
          <div className="text-sm text-muted-foreground">
            {mockWeeklyPlan.actualLoad} / {mockWeeklyPlan.plannedLoad} TSS
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {progress.toFixed(0)}% complete
          </div>
        </div>

        {/* Daily load chart */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Bar dataKey="load" radius={[4, 4, 0, 0]}>
                {weekData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? 'hsl(var(--accent))' : 'hsl(var(--muted))'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Coach notes */}
        {mockWeeklyPlan.coachNotes && (
          <div className="border-t border-border pt-4">
            <p className="text-sm text-muted-foreground italic">
              "{mockWeeklyPlan.coachNotes.slice(0, 120)}..."
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
