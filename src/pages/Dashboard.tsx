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
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your training at a glance</p>
        </div>

        {/* Daily Decision - Most important */}
        <DailyDecisionCard />

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Workout */}
          <div className="lg:col-span-2">
            <TodayWorkoutCard />
          </div>

          {/* Load Status */}
          <div>
            <LoadStatusCard />
          </div>
        </div>

        {/* Secondary row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Load */}
          <WeeklyLoadCard />

          {/* Recent Activities */}
          <RecentActivitiesCard />

          {/* Coach Chat Widget */}
          <CoachChatWidget />
        </div>
      </div>
    </AppLayout>
  );
}
