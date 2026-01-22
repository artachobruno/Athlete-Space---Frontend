import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PlanChangeHistory } from '@/components/plan/PlanChangeHistory';
import { PlanCoachChat } from '@/components/plan/PlanCoachChat';
import { SeasonView } from '@/components/calendar/SeasonView';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, format, startOfMonth } from 'date-fns';

export default function TrainingPlan() {
  useSyncTodayWorkout();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Quarter-based navigation for strategic view
  const navigatePreviousQuarter = () => {
    setCurrentDate(subMonths(currentDate, 3));
  };

  const navigateNextQuarter = () => {
    setCurrentDate(addMonths(currentDate, 3));
  };

  const goToCurrentQuarter = () => {
    setCurrentDate(new Date());
  };

  const getQuarterLabel = () => {
    const quarterStart = startOfMonth(new Date(currentDate.getFullYear(), Math.floor(currentDate.getMonth() / 3) * 3, 1));
    const quarterEnd = new Date(quarterStart);
    quarterEnd.setMonth(quarterEnd.getMonth() + 2);
    return `${format(quarterStart, 'MMM')} – ${format(quarterEnd, 'MMM yyyy')}`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Plan</h1>
            <p className="text-muted-foreground mt-1">Your training strategy</p>
          </div>
          
          {/* Quarter Navigation for strategic overview */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePreviousQuarter}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNextQuarter}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={goToCurrentQuarter} className="text-sm">
              Current
            </Button>
            <span className="font-semibold text-foreground ml-2">
              {getQuarterLabel()}
            </span>
          </div>
        </div>

        {/* Season View - Training phases, goal races, strategic overview */}
        <SeasonView currentDate={currentDate} />

        {/* Plan Change History - Strategic rationale */}
        <PlanChangeHistory />

        {/* Floating Coach Chat */}
        <PlanCoachChat />
      </div>
    </AppLayout>
  );
}
