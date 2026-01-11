import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { createManualSession } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

export function AddSessionModal({ open, onOpenChange, initialDate, onSuccess }: AddSessionModalProps) {
  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<'easy' | 'workout' | 'long' | 'rest' | ''>('');
  const [distanceKm, setDistanceKm] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: type is required
    if (!type) {
      setError('Session type is required');
      return;
    }

    // Validation: either distance or duration must be provided (except for rest)
    if (type !== 'rest' && !distanceKm && !durationMinutes) {
      setError('Either distance or duration is required');
      return;
    }

    // Validation: if distance provided, must be a valid number
    if (distanceKm && (isNaN(parseFloat(distanceKm)) || parseFloat(distanceKm) <= 0)) {
      setError('Distance must be a positive number');
      return;
    }

    // Validation: if duration provided, must be a valid number
    if (durationMinutes && (isNaN(parseInt(durationMinutes, 10)) || parseInt(durationMinutes, 10) <= 0)) {
      setError('Duration must be a positive number');
      return;
    }

    setIsSubmitting(true);

    try {
      await createManualSession({
        date,
        type,
        distance_km: distanceKm ? parseFloat(distanceKm) : null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        notes: notes.trim() || null,
      });

      toast({
        title: 'Session added',
        description: 'The session has been added to your calendar.',
      });

      // Reset form
      setType('');
      setDistanceKm('');
      setDurationMinutes('');
      setNotes('');
      setError(null);

      // Close modal and refresh calendar
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to create session:', err);
      const apiError = err as { message?: string; response?: { data?: { message?: string; detail?: string } } };
      const errorMessage = apiError.response?.data?.message || apiError.response?.data?.detail || apiError.message || 'Failed to create session';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Session Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'easy' | 'workout' | 'long' | 'rest')} disabled={isSubmitting}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="workout">Workout</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="rest">Rest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                disabled={isSubmitting || type === 'rest'}
                placeholder="Optional"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                step="1"
                min="0"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                disabled={isSubmitting || type === 'rest'}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
