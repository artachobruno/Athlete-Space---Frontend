import { useAuth } from '@/context/AuthContext';
import { isPreviewMode } from '@/lib/preview';

// Athlete Dashboard Components
import { AppLayout } from '@/components/layout/AppLayout';
import { DailyDecisionCard } from '@/components/dashboard/DailyDecisionCard';
import { TodayWorkoutCard } from '@/components/dashboard/TodayWorkoutCard';
import { WeeklyLoadCard } from '@/components/dashboard/WeeklyLoadCard';
import { RecentActivitiesCard } from '@/components/dashboard/RecentActivitiesCard';
import { LoadStatusCard } from '@/components/dashboard/LoadStatusCard';
import { CoachChatWidget } from '@/components/dashboard/CoachChatWidget';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';

// Coach Dashboard Components
import { useCoachDashboardData, IS_PREVIEW } from '@/hooks/useCoachDashboardData';
import { CoachKpiCard } from '@/components/coach/CoachKpiCard';
import { AdherenceChart } from '@/components/coach/AdherenceChart';
import { WeeklyLoadChart } from '@/components/coach/WeeklyLoadChart';
import { RiskList } from '@/components/coach/RiskList';
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Athlete Dashboard - Default view for athlete users
 */
function AthleteDashboard() {
  useSyncTodayWorkout();
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

/**
 * Coach Dashboard - View for coach users
 * Shows athlete adherence, training trends, and risk flags
 */
function CoachDashboard() {
  const data = useCoachDashboardData();

  // Determine adherence color variant
  const getAdherenceVariant = (pct: number): 'success' | 'warning' | 'danger' => {
    if (pct >= 80) return 'success';
    if (pct >= 60) return 'warning';
    return 'danger';
  };

  // Determine load trend display
  const getLoadTrendDisplay = (trend: 'stable' | 'increasing' | 'decreasing') => {
    switch (trend) {
      case 'increasing':
        return { value: '↗ Increasing', icon: TrendingUp };
      case 'decreasing':
        return { value: '↘ Decreasing', icon: TrendingDown };
      default:
        return { value: '→ Stable', icon: Minus };
    }
  };

  // Determine risk level variant
  const getRiskVariant = (level: 'low' | 'medium' | 'high'): 'success' | 'warning' | 'danger' => {
    switch (level) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'danger';
    }
  };

  const loadTrend = getLoadTrendDisplay(data.load_trend);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Preview Banner */}
        {IS_PREVIEW && <PreviewBanner />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Coach Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of athlete adherence, trends, and risk
            </p>
          </div>
          
          {/* Athlete selector (disabled - for visual purposes only) */}
          <Select disabled defaultValue="john">
            <SelectTrigger className="w-[180px] opacity-60">
              <SelectValue placeholder="Select athlete" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="john">John D.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CoachKpiCard
            label="Adherence"
            value={`${data.adherence_pct}%`}
            subtext="Last 14 days"
            variant={getAdherenceVariant(data.adherence_pct)}
          />
          <CoachKpiCard
            label="Training Load"
            value={loadTrend.value}
            subtext="CTL trend (14 days)"
            variant="default"
          />
          <CoachKpiCard
            label="Risk"
            value={data.risk_level.charAt(0).toUpperCase() + data.risk_level.slice(1)}
            subtext="No active alerts"
            variant={getRiskVariant(data.risk_level)}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AdherenceChart data={data.adherence_trend} />
          <WeeklyLoadChart data={data.weekly_loads} />
        </div>

        {/* Risk Signals */}
        <RiskList risks={data.risks} />
      </div>
    </AppLayout>
  );
}

/**
 * Role-aware Dashboard
 * Renders CoachDashboard for coaches, AthleteDashboard for athletes
 * In preview mode, defaults to coach role
 */
export default function Dashboard() {
  const { user } = useAuth();
  
  // In preview mode, default to coach role
  // Otherwise use user's actual role, defaulting to athlete
  const role = isPreviewMode() ? 'coach' : (user?.role ?? 'athlete');

  if (role === 'coach') {
    return <CoachDashboard />;
  }

  return <AthleteDashboard />;
}