import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';
import { isPreviewMode } from '@/lib/preview';

// Types for Coach Dashboard
interface WeeklyLoad {
  week: string;
  level: 'low' | 'medium' | 'high';
  value: number;
}

interface Risk {
  type: 'success' | 'warning' | 'info';
  message: string;
}

// Athlete Dashboard Components
import { AppLayout } from '@/components/layout/AppLayout';
import { DailyDecisionCard } from '@/components/dashboard/DailyDecisionCard';
import { TodayWorkoutCard } from '@/components/dashboard/TodayWorkoutCard';
import { TodayCompletionStatus } from '@/components/today/TodayCompletionStatus';
import { WorkoutInstructionsCard } from '@/components/today/WorkoutInstructionsCard';
import { WorkoutStepsCard } from '@/components/today/WorkoutStepsCard';
import { CoachInsightCard } from '@/components/today/CoachInsightCard';
import { useSyncTodayWorkout } from '@/hooks/useSyncTodayWorkout';
import { useDashboardData } from '@/hooks/useDashboardData';

// Coach Dashboard Components
import { useCoachDashboardData, useAthleteSelection, IS_PREVIEW } from '@/hooks/useCoachDashboardData';
import { CoachKpiCard } from '@/components/coach/CoachKpiCard';
import { AdherenceChart } from '@/components/coach/AdherenceChart';
import { WeeklyLoadChart } from '@/components/coach/WeeklyLoadChart';
import { RiskList } from '@/components/coach/RiskList';
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/**
 * Athlete Dashboard - Default view for athlete users
 * 
 * Fetches all dashboard data centrally to prevent duplicate requests.
 * Data is passed as props to components.
 */
function AthleteDashboard() {
  useSyncTodayWorkout();
  const dashboardData = useDashboardData();

  // Detect if there's a planned session today
  const hasPlannedSessionToday = useMemo(() => {
    if (!dashboardData.todayData?.sessions) return false;
    return dashboardData.todayData.sessions.some(
      s => s.status === 'planned' || s.status === 'completed'
    );
  }, [dashboardData.todayData]);

  // Get the first planned session for LLM-generated content
  const firstPlannedSession = useMemo(() => {
    if (!dashboardData.todayData?.sessions) return null;
    return dashboardData.todayData.sessions.find(
      s => s.status === 'planned' || s.status === 'completed'
    ) || null;
  }, [dashboardData.todayData]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Today</h1>
          <p className="text-muted-foreground mt-1">What you need to do now</p>
        </div>

        {/* Centered container with consistent styling */}
        <div className="flex flex-col gap-6 max-w-[1000px] mx-auto px-4 sm:px-6">
          {/* 1. Today's Verdict Card */}
          <DailyDecisionCard
            todayIntelligence={dashboardData.todayIntelligence}
            isLoading={dashboardData.todayIntelligenceLoading}
            error={dashboardData.todayIntelligenceError}
          />
          
          {/* 2. Today's Session Card */}
          <TodayWorkoutCard
            todayData={dashboardData.todayData}
            isLoading={dashboardData.todayDataLoading}
            error={dashboardData.todayDataError}
            trainingLoad7d={dashboardData.trainingLoad7d}
            activities10={dashboardData.activities10}
            todayIntelligence={dashboardData.todayIntelligence}
          />

          {/* 3. Workout Instructions Card */}
          {firstPlannedSession?.instructions && firstPlannedSession.instructions.length > 0 && (
            <WorkoutInstructionsCard instructions={firstPlannedSession.instructions} />
          )}

          {/* 4. Workout Steps Card */}
          {firstPlannedSession?.steps && firstPlannedSession.steps.length > 0 && (
            <WorkoutStepsCard steps={firstPlannedSession.steps} />
          )}

          {/* 5. Coach Insight Card */}
          {firstPlannedSession?.coach_insight && (
            <CoachInsightCard coachInsight={firstPlannedSession.coach_insight} />
          )}

          {/* 6. Completion Status Card */}
          <TodayCompletionStatus
            todayData={dashboardData.todayData}
            activities10={dashboardData.activities10}
            todayIntelligence={dashboardData.todayIntelligence}
          />
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
  const { athletes, selectedAthlete, selectedAthleteId, setSelectedAthleteId, isLoading: athletesLoading } = useAthleteSelection();
  const dashboardResult = useCoachDashboardData(selectedAthleteId ?? undefined);
  const data = dashboardResult as { 
    adherence_pct: number; 
    load_trend: 'stable' | 'increasing' | 'decreasing'; 
    risk_level: 'low' | 'medium' | 'high';
    adherence_trend: number[];
    weekly_loads: WeeklyLoad[];
    risks: Risk[];
    isLoading?: boolean;
    error?: unknown;
  };

  // Get avatar initials - use backend-provided or generate from name
  const getAvatarInitials = (athlete: { name: string; avatar_initials?: string } | null): string => {
    if (!athlete) return '';
    if (athlete.avatar_initials) {
      return athlete.avatar_initials;
    }
    return athlete.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

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
  const isLoadingDashboard = data.isLoading ?? false;
  const hasError = !!data.error;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Preview Banner */}
        {IS_PREVIEW && <PreviewBanner />}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[clamp(1.25rem,3vw,1.5rem)] font-semibold text-primary">Coach Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of athlete adherence, trends, and risk
            </p>
          </div>
          
          {/* Athlete selector */}
          <div className="bg-card rounded-lg border px-3 py-2 inline-flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Active Athlete</span>
            {athletesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <Select 
                value={selectedAthleteId ?? undefined} 
                onValueChange={setSelectedAthleteId}
                disabled={athletes.length === 0}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select athlete">
                    {selectedAthlete && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                            {getAvatarInitials(selectedAthlete)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{selectedAthlete.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-accent text-accent-foreground">
                            {getAvatarInitials(athlete)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{athlete.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Loading or Error State */}
        {isLoadingDashboard && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading dashboard data...</span>
            </div>
          </div>
        )}

        {hasError && !isLoadingDashboard && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="font-medium text-destructive">Failed to load dashboard data</p>
            <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page.</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoadingDashboard && !hasError && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-4">
                <CoachKpiCard
                  label="Adherence"
                  value={`${data.adherence_pct}%`}
                  subtext="Last 14 days"
                  variant={getAdherenceVariant(data.adherence_pct)}
                />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <CoachKpiCard
                  label="Training Load"
                  value={loadTrend.value}
                  subtext="CTL trend (14 days)"
                  variant="default"
                />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <CoachKpiCard
                  label="Risk"
                  value={data.risk_level.charAt(0).toUpperCase() + data.risk_level.slice(1)}
                  subtext="No active alerts"
                  variant={getRiskVariant(data.risk_level)}
                />
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 lg:col-span-6">
                <AdherenceChart data={data.adherence_trend} />
              </div>
              <div className="col-span-12 lg:col-span-6">
                <WeeklyLoadChart data={data.weekly_loads} />
              </div>
            </div>

            {/* Risk Signals */}
            <RiskList risks={data.risks} />
          </>
        )}
      </div>
    </AppLayout>
  );
}

/**
 * Role-aware Dashboard
 * Renders CoachDashboard for coaches, AthleteDashboard for athletes
 * In preview mode, defaults to athlete role
 */
export default function Dashboard() {
  const { user } = useAuth();
  
  // In preview mode, default to athlete role
  // Otherwise use user's actual role, defaulting to athlete
  const role = isPreviewMode() ? 'athlete' : (user?.role ?? 'athlete');

  if (role === 'coach') {
    return <CoachDashboard />;
  }

  return <AthleteDashboard />;
}