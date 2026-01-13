import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { format } from 'date-fns';
import { useCreatePlannedSession } from '@/hooks/useCalendarMutations';

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

export function AddSessionModal({ open, onOpenChange, initialDate, onSuccess }: AddSessionModalProps) {
  const { unitSystem } = useUnitSystem();
  const createSession = useCreatePlannedSession();
  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState<'easy' | 'workout' | 'long' | 'rest' | ''>('');
  const [distanceInput, setDistanceInput] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Get distance unit label based on user's unit system
  const distanceUnit = unitSystem === 'imperial' ? 'mi' : 'km';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: type is required
    if (!type) {
      setError('Session type is required');
      return;
    }

    // Validation: either distance or duration must be provided (except for rest)
    if (type !== 'rest' && !distanceInput && !durationMinutes) {
      setError('Either distance or duration is required');
      return;
    }

    // Validation: if distance provided, must be a valid number
    if (distanceInput && (isNaN(parseFloat(distanceInput)) || parseFloat(distanceInput) <= 0)) {
      setError('Distance must be a positive number');
      return;
    }

    // Validation: if duration provided, must be a valid number
    if (durationMinutes && (isNaN(parseInt(durationMinutes, 10)) || parseInt(durationMinutes, 10) <= 0)) {
      setError('Duration must be a positive number');
      return;
    }

    // Convert distance from user units to km for the API
    let distanceKm: number | null = null;
    if (distanceInput) {
      const distanceValue = parseFloat(distanceInput);
      if (unitSystem === 'imperial') {
        // Convert miles to km
        distanceKm = distanceValue / 0.621371;
      } else {
        // Already in km
        distanceKm = distanceValue;
      }
    }

    createSession.mutate(
      {
        date,
        type,
        distance_km: distanceKm,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Session added',
            description: 'The session has been added to your calendar.',
          });

          // Reset form
          setType('');
          setDistanceInput('');
          setDurationMinutes('');
          setNotes('');
          setError(null);

          // Close modal and refresh calendar
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (err) => {
          console.error('Failed to create session:', err);
          const apiError = err as { 
            message?: string; 
            response?: { 
              status?: number;
              data?: { 
                message?: string; 
                detail?: string | unknown;
                errors?: Array<{ field: string; message: string }>;
              } 
            } 
          };
          
          // Try to extract a meaningful error message
          let errorMessage = 'Failed to create session';
          if (apiError.response?.data) {
            const data = apiError.response.data;
            
            // Log full details for debugging
            console.error('API error details:', data);
            
            // Handle Pydantic/FastAPI validation errors (422 status)
            if (apiError.response.status === 422 && data.detail) {
              if (Array.isArray(data.detail)) {
                // FastAPI validation errors format: [{"loc": ["field"], "msg": "...", "type": "..."}]
                const validationErrors = data.detail as Array<{ loc?: unknown[]; msg?: string; type?: string }>;
                const fieldErrors = validationErrors.map(err => {
                  const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'unknown';
                  return `${field}: ${err.msg || err.type || 'validation error'}`;
                });
                errorMessage = fieldErrors.length > 0 ? fieldErrors.join(', ') : 'Validation error';
              } else if (typeof data.detail === 'object') {
                // Handle object format validation errors
                const detailObj = data.detail as Record<string, unknown>;
                const fieldErrors: string[] = [];
                for (const [field, errors] of Object.entries(detailObj)) {
                  if (Array.isArray(errors) && errors.length > 0) {
                    const errorMsg = errors[0] && typeof errors[0] === 'object' && 'msg' in errors[0]
                      ? String(errors[0].msg)
                      : String(errors[0]);
                    fieldErrors.push(`${field}: ${errorMsg}`);
                  }
                }
                errorMessage = fieldErrors.length > 0 ? fieldErrors.join(', ') : 'Validation error';
              } else if (typeof data.detail === 'string') {
                errorMessage = data.detail;
              }
            } else if (data.message) {
              errorMessage = data.message;
            } else if (Array.isArray(data.errors) && data.errors.length > 0) {
              errorMessage = data.errors.map(e => `${e.field}: ${e.message}`).join(', ');
            }
          } else if (apiError.message) {
            errorMessage = apiError.message;
          }
          
          setError(errorMessage);
        },
      }
    );
  };

  const handleClose = () => {
    if (!createSession.isPending) {
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Session</DialogTitle>
          <DialogDescription>
            Create a new training session for your calendar.
          </DialogDescription>
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
              disabled={createSession.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Session Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'easy' | 'workout' | 'long' | 'rest')} disabled={createSession.isPending}>
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
              <Label htmlFor="distance">Distance ({distanceUnit})</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                min="0"
                value={distanceInput}
                onChange={(e) => setDistanceInput(e.target.value)}
                disabled={createSession.isPending || type === 'rest'}
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
                disabled={createSession.isPending || type === 'rest'}
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
              disabled={createSession.isPending}
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={createSession.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
