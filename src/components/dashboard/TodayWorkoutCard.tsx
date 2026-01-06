import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockPlannedWorkouts } from '@/lib/mock-data';
import { format } from 'date-fns';
import { Clock, Route, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const intentColors = {
  aerobic: 'bg-training-aerobic/15 text-training-aerobic border-training-aerobic/30',
  threshold: 'bg-training-threshold/15 text-training-threshold border-training-threshold/30',
  vo2: 'bg-training-vo2/15 text-training-vo2 border-training-vo2/30',
  endurance: 'bg-training-endurance/15 text-training-endurance border-training-endurance/30',
  recovery: 'bg-training-recovery/15 text-training-recovery border-training-recovery/30',
};

export function TodayWorkoutCard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayWorkout = mockPlannedWorkouts.find(w => w.date === today);

  if (!todayWorkout) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Today's Workout</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Rest day - no workout scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Today's Workout</CardTitle>
          <Badge variant="outline" className={cn(intentColors[todayWorkout.intent])}>
            {todayWorkout.intent}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{todayWorkout.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{todayWorkout.description}</p>
        </div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{todayWorkout.duration} min</span>
          </div>
          {todayWorkout.distance && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span>{todayWorkout.distance} km</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="capitalize">{todayWorkout.sport}</span>
          </div>
        </div>

        {todayWorkout.structure && todayWorkout.structure.length > 0 && (
          <div className="border-t border-border pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Workout Structure</h4>
            <div className="space-y-2">
              {todayWorkout.structure.map((segment, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm py-1.5 px-3 rounded bg-muted/50"
                >
                  <span className="capitalize text-muted-foreground">{segment.type}</span>
                  <div className="flex items-center gap-4">
                    {segment.duration && (
                      <span className="text-foreground">{segment.duration} min</span>
                    )}
                    {segment.intensity && (
                      <span className="text-muted-foreground">{segment.intensity}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
