import { F1Card, F1CardLabel } from '@/components/ui/f1-card';
import { cn } from '@/lib/utils';

interface CoachKpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

// F1 Design: Map variants to F1 status colors
type F1Status = 'safe' | 'caution' | 'danger' | 'active';

const variantToStatus: Record<string, F1Status | undefined> = {
  default: undefined,
  success: 'safe',
  warning: 'caution',
  danger: 'danger',
};

const variantToTextClass: Record<string, string> = {
  default: 'text-[hsl(var(--f1-text-primary))]',
  success: 'f1-status-safe',
  warning: 'f1-status-caution',
  danger: 'f1-status-danger',
};

/**
 * KPI Card for Coach Dashboard
 * Displays a single metric with label, value, and subtext
 * F1 Design: Telemetry-style metric display
 */
export function CoachKpiCard({ label, value, subtext, variant = 'default' }: CoachKpiCardProps) {
  const status = variantToStatus[variant];
  const valueColorClass = variantToTextClass[variant];

  return (
    <F1Card status={status} padding="lg">
      <F1CardLabel className="mb-2 block">{label}</F1CardLabel>
      <p className={cn('f1-metric f1-metric-lg', valueColorClass)}>{value}</p>
      <p className="f1-label mt-2 text-[hsl(var(--f1-text-muted))]">{subtext}</p>
    </F1Card>
  );
}
