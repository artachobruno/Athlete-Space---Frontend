import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CoachKpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * KPI Card for Coach Dashboard
 * Displays a single metric with label, value, and subtext
 */
export function CoachKpiCard({ label, value, subtext, variant = 'default' }: CoachKpiCardProps) {
  const valueColorClass = {
    default: 'text-foreground',
    success: 'text-load-fresh',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-destructive',
  }[variant];

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className={cn('text-2xl sm:text-3xl font-bold', valueColorClass)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  );
}
