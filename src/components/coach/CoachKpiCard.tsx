import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CoachKpiCardProps {
  label: string;
  value: string | number;
  subtext: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const variantToTextClass: Record<string, string> = {
  default: '',
  success: 'text-green-600 dark:text-green-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

/**
 * KPI Card for Coach Dashboard
 * Displays a single metric with label, value, and subtext
 */
export function CoachKpiCard({ label, value, subtext, variant = 'default' }: CoachKpiCardProps) {
  const valueColorClass = variantToTextClass[variant];

  return (
    <Card>
      <CardContent className="pt-6">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">{label}</span>
        <p className={cn('text-3xl font-semibold', valueColorClass)}>{value}</p>
        <p className="text-xs text-muted-foreground mt-2">{subtext}</p>
      </CardContent>
    </Card>
  );
}
