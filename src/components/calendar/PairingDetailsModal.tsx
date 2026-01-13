import { useState } from 'react';
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
import { Clock, Calendar, ExternalLink, AlertTriangle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
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

interface PairingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: CompletedActivity;
  session: CalendarSession | null;
  onUnpair: () => Promise<void>;
}

export function PairingDetailsModal({
  open,
  onOpenChange,
  activity,
  session,
  onUnpair,
}: PairingDetailsModalProps) {
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [isUnpairing, setIsUnpairing] = useState(false);

  const handleUnpairClick = () => {
    setShowUnpairConfirm(true);
  };

  const handleUnpairConfirm = async () => {
    setIsUnpairing(true);
    try {
      await onUnpair();
      setShowUnpairConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to unpair activity:', error);
      // Error handling should be done by parent component via toast
    } finally {
      setIsUnpairing(false);
    }
  };

  const handleUnpairCancel = () => {
    setShowUnpairConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <DialogTitle>Activity Pairing Details</DialogTitle>
                <DialogDescription>
                  This activity is paired with a planned session
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
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-muted-foreground">
                This activity is paired with the planned session above. Paired activities are read-only and cannot be moved.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnpairClick}
              disabled={isUnpairing}
            >
              Unpair Activity
            </Button>
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
            <AlertDialogCancel onClick={handleUnpairCancel} disabled={isUnpairing}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpairConfirm}
              disabled={isUnpairing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUnpairing ? 'Unpairing...' : 'Unpair'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
