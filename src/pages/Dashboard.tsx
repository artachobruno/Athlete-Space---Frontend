import { AppLayout } from '@/components/layout/AppLayout';
import { DailyDecisionCard } from '@/components/dashboard/DailyDecisionCard';
import { TodayWorkoutCard } from '@/components/dashboard/TodayWorkoutCard';
import { WeeklyLoadCard } from '@/components/dashboard/WeeklyLoadCard';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
import { LoadStatusCard } from '@/components/dashboard/LoadStatusCard';
import { CoachChatWidget } from '@/components/dashboard/CoachChatWidget';

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your training at a glance</p>
        </div>

        {/* Decision + Coach row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Decision - Primary emphasis */}
          <div className="lg:col-span-2">
            <DailyDecisionCard />
          </div>

          {/* Coach Chat Widget - Secondary */}
          <div>
            <CoachChatWidget />
          </div>
        </div>

        {/* Today's Workout + Load Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TodayWorkoutCard />
          </div>
          <div>
            <LoadStatusCard />
          </div>
        </div>

        {/* Weekly Load + Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeeklyLoadCard />
          <RecentActivitiesCard />
        </div>
      </div>
    </AppLayout>
  );
}
