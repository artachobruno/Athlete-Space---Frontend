import { AppLayout } from '@/components/layout/AppLayout';
import { useCoachDashboardData, useAthleteSelection, IS_PREVIEW } from '@/hooks/useCoachDashboardData';
import { CoachKpiCard } from '@/components/coach/CoachKpiCard';
import { AdherenceChart } from '@/components/coach/AdherenceChart';
import { WeeklyLoadChart } from '@/components/coach/WeeklyLoadChart';
import { RiskList } from '@/components/coach/RiskList';
import { PreviewBanner } from '@/components/preview/PreviewBanner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { CoachDashboardData } from '@/mock/coachDashboard.mock';

/**
 * Coach Dashboard - Read-only view
 * Shows athlete adherence, training trends, and risk flags
 * 
 * Uses real API endpoints: GET /api/coach/athletes and GET /api/coach/athletes/{id}/dashboard
 */
export default function CoachDashboard() {
  const { athletes, selectedAthlete, selectedAthleteId, setSelectedAthleteId, isLoading: athletesLoading } = useAthleteSelection();
  const dashboardResult = useCoachDashboardData(selectedAthleteId ?? undefined);
  const data = dashboardResult as CoachDashboardData & { isLoading?: boolean; error?: unknown };

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

  // Get avatar initials - use backend-provided or generate from name
  const getAvatarInitials = (athlete: { name: string; avatar_initials?: string } | null): string => {
    if (!athlete) return '';
    if (athlete.avatar_initials) {
      return athlete.avatar_initials;
    }
    return athlete.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
            <h1 className="text-2xl font-semibold text-primary">Coach Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of athlete adherence, trends, and risk
            </p>
          </div>
          
          {/* Athlete selector */}
          <div className="flex items-center gap-2">
            {athletesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading athletes...</span>
              </div>
            ) : (
              <Select 
                value={selectedAthleteId ?? undefined} 
                onValueChange={setSelectedAthleteId}
                disabled={athletes.length === 0}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select athlete">
                    {selectedAthlete && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getAvatarInitials(selectedAthlete)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{selectedAthlete.name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {athletes.map((athlete) => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getAvatarInitials(athlete)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{athlete.name}</span>
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
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Failed to load dashboard data</p>
            <p className="text-sm mt-1">Please try refreshing the page.</p>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoadingDashboard && !hasError && (
          <>
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
          </>
        )}
      </div>
    </AppLayout>
  );
}
