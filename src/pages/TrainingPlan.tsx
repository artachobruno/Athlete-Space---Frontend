import { AppLayout } from '@/components/layout/AppLayout';
import { WeeklyPlanOverview } from '@/components/plan/WeeklyPlanOverview';
import { WeeklyStructureStrip } from '@/components/plan/WeeklyStructureStrip';
import { DailyWorkoutList } from '@/components/plan/DailyWorkoutList';
import { PlanChangeHistory } from '@/components/plan/PlanChangeHistory';
import { PlanCoachChat } from '@/components/plan/PlanCoachChat';

export default function TrainingPlan() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Training Plan</h1>
          <p className="text-muted-foreground mt-1">This week&apos;s training as directed by your coach</p>
        </div>

        {/* Weekly Overview */}
        <WeeklyPlanOverview />

        {/* Weekly Structure Strip */}
        <WeeklyStructureStrip />

        {/* Daily Workout List */}
        <DailyWorkoutList />

        {/* Plan Change History */}
        <PlanChangeHistory />

        {/* Floating Coach Chat */}
        <PlanCoachChat />
      </div>
    </AppLayout>
  );
}
