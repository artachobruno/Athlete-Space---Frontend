/**
 * Phase 6B: Compliance Actions Component
 * 
 * Provides actions for marking sessions as completed, skipped, or modified.
 * Each action calls POST /calendar/compliance - frontend does not infer compliance.
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, XCircle, Edit, MoreVertical, Loader2 } from 'lucide-react';
import { updateSessionStatus } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { CalendarSession } from '@/lib/api';

interface ComplianceActionsProps {
  session: CalendarSession;
  onStatusChange?: () => void;
}

export function ComplianceActions({ session, onStatusChange }: ComplianceActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const handleStatusUpdate = async (status: 'completed' | 'skipped' | 'cancelled') => {
    setIsUpdating(true);
    try {
      await updateSessionStatus(session.id, status);
      
      // Invalidate calendar queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['calendarWeek'] });
      await queryClient.invalidateQueries({ queryKey: ['calendarSeason'] });
      await queryClient.invalidateQueries({ queryKey: ['calendarToday'] });

      toast({
        title: 'Session updated',
        description: `Session marked as ${status}.`,
      });

      onStatusChange?.();
    } catch (error) {
      const apiError = error as { message?: string };
      const errorMessage = apiError.message || 'Failed to update session status. Please try again.';
      
      toast({
        title: 'Update failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Only show actions for planned sessions
  if (session.status !== 'planned') {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleStatusUpdate('completed')}
          disabled={isUpdating}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Mark as Completed
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusUpdate('skipped')}
          disabled={isUpdating}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Mark as Skipped
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleStatusUpdate('cancelled')}
          disabled={isUpdating}
        >
          <Edit className="mr-2 h-4 w-4" />
          Cancel Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
