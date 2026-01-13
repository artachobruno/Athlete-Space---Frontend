import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Link2, CheckCircle2, Loader2 } from 'lucide-react';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { cn } from '@/lib/utils';
import type { CompletedActivity } from '@/types';
import type { CalendarSession } from '@/lib/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useManualPair, useManualUnpair } from '@/hooks/usePairingMutations';
import { toast } from '@/hooks/use-toast';
import { fetchCalendarWeek } from '@/lib/api';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { normalizeSportType } from '@/lib/session-utils';
import { useDeleteActivity, useDeletePlannedSession } from '@/hooks/useDeleteMutations';
import { Trash2 } from 'lucide-react';

interface PairingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: CompletedActivity;
  session: CalendarSession | null;
}

export function PairingDetailsModal({
  open,
  onOpenChange,
  activity,
  session,
}: PairingDetailsModalProps) {
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [showMergeSelector, setShowMergeSelector] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const unpairMutation = useManualUnpair();
  const pairMutation = useManualPair();
  const deleteActivityMutation = useDeleteActivity();
  const deletePlannedSessionMutation = useDeletePlannedSession();
  const [showDeleteActivityConfirm, setShowDeleteActivityConfirm] = useState(false);
  const [showDeleteSessionConfirm, setShowDeleteSessionConfirm] = useState(false);

  // Check pairing state: activity is paired if it has planned_session_id
  // Frontend invariant: UI = lookup only, backend = authority
  const isPaired = Boolean(activity.planned_session_id);

  // Get activity date and sport for filtering planned sessions
  const activityDate = activity.date ? parseISO(activity.date) : null;
  const activityDateStr = activity.date ? format(parseISO(activity.date), 'yyyy-MM-dd') : null;
  const activitySport = normalizeSportType(activity.sport);

  // Fetch week data to get planned sessions for merge selector
  const weekStart = activityDate ? startOfWeek(activityDate, { weekStartsOn: 1 }) : null;
  const weekStartStr = weekStart ? format(weekStart, 'yyyy-MM-dd') : null;

  const { data: weekData, isLoading: isLoadingSessions } = useAuthenticatedQuery({
    queryKey: ['calendarWeek', weekStartStr],
    queryFn: () => weekStartStr ? fetchCalendarWeek(weekStartStr) : Promise.resolve({ week_start: '', week_end: '', sessions: [] }),
    enabled: !isPaired && showMergeSelector && !!weekStartStr,
    retry: 1,
  });

  // Filter planned sessions for merge selector:
  // - Same day as activity
  // - Same sport (normalized)
  // - Unpaired only (completed_activity_id is null)
  const availableSessions = useMemo(() => {
    if (!weekData || !activityDateStr) return [];

    const sessions = Array.isArray(weekData.sessions) ? weekData.sessions : [];
    return sessions.filter((s: CalendarSession) => {
      // Same day
      if (s.date !== activityDateStr) return false;
      
      // Same sport (normalized)
      const sessionSport = normalizeSportType(s.type);
      if (sessionSport !== activitySport) return false;
      
      // Unpaired only
      if (s.completed_activity_id) return false;
      
      return true;
    });
  }, [weekData, activityDateStr, activitySport]);

  const handleUnpairClick = () => {
    setShowUnpairConfirm(true);
  };

  const handleUnpairConfirm = async () => {
    try {
      await unpairMutation.mutateAsync(activity.id);
      toast({
        title: 'Activity unpaired',
        description: 'The activity has been unpaired from its planned session.',
      });
      setShowUnpairConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to unpair activity:', error);
      toast({
        title: 'Unpair failed',
        description: 'Failed to unpair the activity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUnpairCancel = () => {
    setShowUnpairConfirm(false);
  };

  const handleMergeClick = () => {
    setShowMergeSelector(true);
  };

  const handleMergeCancel = () => {
    setShowMergeSelector(false);
    setSelectedSessionId(null);
  };

  const handleMergeConfirm = async () => {
    if (!selectedSessionId) return;

    try {
      await pairMutation.mutateAsync({
        activityId: activity.id,
        plannedSessionId: selectedSessionId,
      });
      toast({
        title: 'Activity paired',
        description: 'The activity has been paired with the planned session.',
      });
      setShowMergeSelector(false);
      setSelectedSessionId(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to pair activity:', error);
      toast({
        title: 'Pair failed',
        description: 'Failed to pair the activity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteActivityClick = () => {
    setShowDeleteActivityConfirm(true);
  };

  const handleDeleteActivityConfirm = async () => {
    try {
      await deleteActivityMutation.mutateAsync(activity.id);
      toast({
        title: 'Activity deleted',
        description: 'The activity has been deleted.',
      });
      setShowDeleteActivityConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete activity:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the activity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSessionClick = () => {
    if (!session) return;
    setShowDeleteSessionConfirm(true);
  };

  const handleDeleteSessionConfirm = async () => {
    if (!session) return;
    
    try {
      await deletePlannedSessionMutation.mutateAsync(session.id);
      toast({
        title: 'Planned session deleted',
        description: 'The planned session has been deleted.',
      });
      setShowDeleteSessionConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to delete planned session:', error);
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the planned session. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg",
                isPaired 
                  ? "bg-green-50 dark:bg-green-950/20" 
                  : "bg-muted"
              )}>
                {isPaired ? (
                  <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <DialogTitle>Activity Pairing Details</DialogTitle>
                <DialogDescription>
                  {isPaired 
                    ? "This activity is paired with a planned session"
                    : "This activity is not paired with any planned session"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Activity Information */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Activity</h4>
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="font-medium text-foreground">{activity.title || 'Untitled Activity'}</div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(activity.date), 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {activity.duration}m
                  </span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {activity.source === 'strava' ? 'Strava' : 'Manual'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Planned Session Information */}
            {session && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Paired Session</h4>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="font-medium text-foreground">{session.title || 'Untitled Session'}</div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {session.date ? format(parseISO(session.date), 'MMM d, yyyy') : 'No date'}
                    </span>
                    {session.duration_minutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {session.duration_minutes}m
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {session.type || 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Pairing Status */}
            {isPaired && (
              <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 p-3">
                <p className="text-xs text-muted-foreground">
                  This activity is paired with the planned session above. Paired activities are read-only and cannot be moved.
                </p>
              </div>
            )}
            {!isPaired && (
              <div className="rounded-lg border border-muted bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  This activity is not paired with any planned session. It can be moved freely.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <div className="flex gap-2">
              {isPaired && (
                <Button
                  variant="destructive"
                  onClick={handleUnpairClick}
                  disabled={unpairMutation.isPending}
                >
                  Unpair Activity
                </Button>
              )}
              {!isPaired && (
                <Button
                  onClick={handleMergeClick}
                  disabled={pairMutation.isPending}
                >
                  Merge with Planned Session
                </Button>
              )}
              <Button
                variant="destructive"
                onClick={handleDeleteActivityClick}
                disabled={deleteActivityMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Activity
              </Button>
              {session && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteSessionClick}
                  disabled={deletePlannedSessionMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Session
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpair Confirmation Dialog */}
      <AlertDialog open={showUnpairConfirm} onOpenChange={setShowUnpairConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpair Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will detach the activity from its planned session. The activity will become unpaired and can be moved again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleUnpairCancel} disabled={unpairMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpairConfirm}
              disabled={unpairMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {unpairMutation.isPending ? 'Unpairing...' : 'Unpair'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Selector Dialog */}
      <AlertDialog open={showMergeSelector} onOpenChange={setShowMergeSelector}>
        <AlertDialogContent className="sm:max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Merge with Planned Session</AlertDialogTitle>
            <AlertDialogDescription>
              Select a planned session from the same day and sport to pair with this activity.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            {isLoadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : availableSessions.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No unpaired planned sessions found for {activityDateStr} ({activitySport}).
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availableSessions.map((s: CalendarSession) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSessionId(s.id)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedSessionId === s.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="font-medium text-sm">{s.title || 'Untitled Session'}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {s.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.duration_minutes}m
                        </span>
                      )}
                      {s.date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(s.date), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                    {s.intensity && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {s.intensity}
                        </Badge>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleMergeCancel} disabled={pairMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleMergeConfirm}
              disabled={!selectedSessionId || pairMutation.isPending}
            >
              {pairMutation.isPending ? 'Pairing...' : 'Pair Activity'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Activity Confirmation Dialog */}
      <AlertDialog open={showDeleteActivityConfirm} onOpenChange={setShowDeleteActivityConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this activity will remove execution data but keep the planned workout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteActivityMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteActivityConfirm}
              disabled={deleteActivityMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteActivityMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Planned Session Confirmation Dialog */}
      {session && (
        <AlertDialog open={showDeleteSessionConfirm} onOpenChange={setShowDeleteSessionConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Planned Session?</AlertDialogTitle>
              <AlertDialogDescription>
                {session.completed_activity_id
                  ? "This session is linked to a completed activity. Deleting it will unpair the activity."
                  : "Delete this planned session?"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deletePlannedSessionMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSessionConfirm}
                disabled={deletePlannedSessionMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletePlannedSessionMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
