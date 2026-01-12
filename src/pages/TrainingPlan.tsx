import { useCallback, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WeeklyPlanOverview } from '@/components/plan/WeeklyPlanOverview';
import { WeeklyStructureStrip } from '@/components/plan/WeeklyStructureStrip';
import { DailyWorkoutList } from '@/components/plan/DailyWorkoutList';
import { PlanChangeHistory } from '@/components/plan/PlanChangeHistory';
import { PlanCoachChat } from '@/components/plan/PlanCoachChat';
import { ComplianceDashboard } from '@/components/calendar/ComplianceDashboard';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';

export default function TrainingPlan() {
  useSyncTodayWorkout();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  
  const navigatePrevious = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const navigateNext = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getNavigationLabel = () => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    return `Week of ${format(weekStart, 'MMM d, yyyy')}`;
  };

  const handleDayClick = useCallback((dateStr: string) => {
    const element = document.getElementById(`workout-${dateStr}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Training Plan</h1>
            <p className="text-muted-foreground mt-1">Your weekly training schedule</p>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={goToToday} className="text-sm">
              Today
            </Button>
            <span className="font-semibold text-foreground ml-2">
              {getNavigationLabel()}
            </span>
          </div>
        </div>

        {/* Compliance Dashboard */}
        <ComplianceDashboard showWeekly={true} showSeason={true} />

        {/* Weekly Overview */}
        <WeeklyPlanOverview currentDate={currentDate} />

        {/* Weekly Structure Strip */}
        <WeeklyStructureStrip currentDate={currentDate} onDayClick={handleDayClick} />

        {/* Daily Workout List */}
        <DailyWorkoutList currentDate={currentDate} />

        {/* Plan Change History */}
        <PlanChangeHistory />

        {/* Floating Coach Chat */}
        <PlanCoachChat />
      </div>
    </AppLayout>
  );
}
