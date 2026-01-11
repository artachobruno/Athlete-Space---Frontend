/**
 * Phase 6B: Compliance Badge Component
 * 
 * Displays visual state for session compliance status.
 * Frontend does not infer compliance - backend is authoritative.
 */

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Edit, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CalendarSession } from '@/lib/api';

interface ComplianceBadgeProps {
  session: CalendarSession;
  className?: string;
}

/**
 * Gets badge variant and icon based on session status
 */
const getStatusDisplay = (status: CalendarSession['status']) => {
  switch (status) {
    case 'completed':
      return {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: 'Completed',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-800',
      };
    case 'skipped':
      return {
        variant: 'outline' as const,
        icon: XCircle,
        label: 'Skipped',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800',
      };
    case 'cancelled':
      return {
        variant: 'outline' as const,
        icon: XCircle,
        label: 'Cancelled',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 border-gray-300 dark:border-gray-800',
      };
    case 'planned':
    default:
      return {
        variant: 'secondary' as const,
        icon: Clock,
        label: 'Scheduled',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300 dark:border-blue-800',
      };
  }
};

export function ComplianceBadge({ session, className }: ComplianceBadgeProps) {
  const display = getStatusDisplay(session.status);
  const Icon = display.icon;

  return (
    <Badge
      variant={display.variant}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs',
        display.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {display.label}
    </Badge>
  );
}
