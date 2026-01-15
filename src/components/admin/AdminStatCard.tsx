import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
  label: string;
  value: string;
  subtext?: string;
  status: 'healthy' | 'warning' | 'critical';
}

/**
 * System status card for admin dashboard
 * Displays a metric with color-coded status indicator
 */
export function AdminStatCard({ label, value, subtext, status }: AdminStatCardProps) {
  const statusColors = {
    healthy: 'text-green-600',
    warning: 'text-amber-500',
    critical: 'text-red-500',
  };

  const statusBg = {
    healthy: 'bg-green-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };

  return (
    <GlassCard>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={cn('text-xl font-semibold', statusColors[status])}>
              {value}
            </p>
            {subtext && (
              <p className="text-xs text-muted-foreground">{subtext}</p>
            )}
          </div>
          <div className={cn('h-2.5 w-2.5 rounded-full mt-1', statusBg[status])} />
        </div>
      </CardContent>
    </GlassCard>
  );
}
