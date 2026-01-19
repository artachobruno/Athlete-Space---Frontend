import { WeekSummaryCardSvg } from './WeekSummaryCardSvg';

export interface SeasonWeekCardProps {
  weekLabel: string;
  dateRange: string;
  totalTss: number;
  maxTss: number;
  completedPct: number;
  workoutsDone: number;
  workoutsPlanned: number;
  ctl: number;
  isCurrent: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export function SeasonWeekCard({
  weekLabel,
  dateRange,
  totalTss,
  maxTss,
  completedPct,
  workoutsDone,
  workoutsPlanned,
  ctl,
  isCurrent,
}: SeasonWeekCardProps) {
  const isPlannedWeek = totalTss === 0;
  const loadRatio = isPlannedWeek ? 0 : clamp(totalTss / Math.max(maxTss, 1), 0, 1);

  return (
    <WeekSummaryCardSvg
      weekLabel={weekLabel}
      dateRange={dateRange}
      totalTss={isPlannedWeek ? 0 : totalTss}
      loadRatio={loadRatio}
      completedPct={isPlannedWeek ? 0 : completedPct}
      workoutsDone={workoutsDone}
      workoutsPlanned={workoutsPlanned}
      ctl={isPlannedWeek ? 0 : ctl}
      isCurrent={isPlannedWeek ? false : isCurrent}
    />
  );
}
