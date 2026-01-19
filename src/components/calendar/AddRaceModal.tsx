import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { GlassCard } from '@/components/ui/glass-card';
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

interface AddRaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

const RACE_DISTANCES = [
  '5K',
  '10K',
  '15K',
  'Half Marathon',
  'Marathon',
  'Ultra',
  'Sprint Triathlon',
  'Olympic Triathlon',
  'Half Ironman',
  'Ironman',
  'Other',
] as const;

export function AddRaceModal({ open, onOpenChange, initialDate, onSuccess }: AddRaceModalProps) {
  const { unitSystem } = useUnitSystem();
  const createSession = useCreatePlannedSession();
  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [raceName, setRaceName] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [customDistance, setCustomDistance] = useState<string>('');
  const [targetTime, setTargetTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Get distance unit label based on user's unit system
  const distanceUnit = unitSystem === 'imperial' ? 'mi' : 'km';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: race name is required
    if (!raceName.trim()) {
      setError('Race name is required');
      return;
    }

    // Validation: distance is required
    const selectedDistance = distance === 'Other' ? customDistance.trim() : distance;
    if (!selectedDistance) {
      setError('Distance is required');
      return;
    }

    // Convert distance to km for notes (if custom distance provided)
    let distanceKm: number | null = null;
    if (distance === 'Other' && customDistance) {
      const distanceValue = parseFloat(customDistance);
      if (!isNaN(distanceValue) && distanceValue > 0) {
        if (unitSystem === 'imperial') {
          // Convert miles to km
          distanceKm = distanceValue / 0.621371;
        } else {
          // Already in km
          distanceKm = distanceValue;
        }
      }
    }

    // Build notes from all fields
    const notesParts: string[] = [];
    if (selectedDistance) {
      notesParts.push(`Distance: ${selectedDistance}`);
    }
    if (targetTime) {
      notesParts.push(`Target Time: ${targetTime}`);
    }
    if (location) {
      notesParts.push(`Location: ${location}`);
    }
    if (notes.trim()) {
      notesParts.push(notes.trim());
    }
    const fullNotes = notesParts.join('\n\n');

    createSession.mutate(
      {
        date,
        sport: 'Race',
        type: 'long', // Races are typically long efforts
        distance_km: distanceKm,
        duration_minutes: null,
        notes: fullNotes || null,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Race added',
            description: 'The race has been added to your calendar.',
          });

          // Reset form
          setRaceName('');
          setDistance('');
          setCustomDistance('');
          setTargetTime('');
          setLocation('');
          setNotes('');
          setError(null);

          // Close modal
          onOpenChange(false);
          onSuccess?.();
        },
        onError: (err) => {
          console.error('Failed to create race:', err);
          const apiError = err as {
            message?: string;
            response?: {
              status?: number;
              data?: {
                message?: string;
                detail?: string | unknown;
                errors?: Array<{ field: string; message: string }>;
              };
            };
          };

          // Handle 500 errors with user-friendly message
          if (apiError.response?.status === 500) {
            setError('Failed to create race. Please try again or refresh.');
            return;
          }

          // Try to extract a meaningful error message
          let errorMessage = 'Failed to create race';
          if (apiError.response?.data) {
            const data = apiError.response.data;

            // Log full details for debugging
            console.error('API error details:', data);

            // Handle Pydantic/FastAPI validation errors (422 status)
            if (apiError.response.status === 422 && data.detail) {
              if (Array.isArray(data.detail)) {
                const validationErrors = data.detail as Array<{ loc?: unknown[]; msg?: string; type?: string }>;
                const fieldErrors = validationErrors.map((err) => {
                  const field = Array.isArray(err.loc) ? err.loc[err.loc.length - 1] : 'unknown';
                  return `${field}: ${err.msg || err.type || 'validation error'}`;
                });
                errorMessage = fieldErrors.length > 0 ? fieldErrors.join(', ') : 'Validation error';
              } else if (typeof data.detail === 'object') {
                const detailObj = data.detail as Record<string, unknown>;
                const fieldErrors: string[] = [];
                for (const [field, errors] of Object.entries(detailObj)) {
                  if (Array.isArray(errors) && errors.length > 0) {
                    const errorMsg =
                      errors[0] && typeof errors[0] === 'object' && 'msg' in errors[0]
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
              errorMessage = data.errors.map((e) => `${e.field}: ${e.message}`).join(', ');
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
      <DialogContent className="p-0 bg-transparent border-none sm:max-w-[500px]">
        <GlassCard variant="raised" className="rounded-2xl">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>Add Race / Event</DialogTitle>
              <DialogDescription>Add a race or event to your calendar.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
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
                <Label htmlFor="raceName">Race / Event Name *</Label>
                <Input
                  id="raceName"
                  type="text"
                  value={raceName}
                  onChange={(e) => setRaceName(e.target.value)}
                  placeholder="e.g., Boston Marathon, Local 5K"
                  required
                  disabled={createSession.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="distance">Distance *</Label>
                <Select value={distance} onValueChange={setDistance} disabled={createSession.isPending}>
                  <SelectTrigger id="distance">
                    <SelectValue placeholder="Select distance" />
                  </SelectTrigger>
                  <SelectContent>
                    {RACE_DISTANCES.map((dist) => (
                      <SelectItem key={dist} value={dist}>
                        {dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {distance === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="customDistance">Custom Distance ({distanceUnit}) *</Label>
                  <Input
                    id="customDistance"
                    type="number"
                    step="0.1"
                    min="0"
                    value={customDistance}
                    onChange={(e) => setCustomDistance(e.target.value)}
                    placeholder="Enter distance"
                    required
                    disabled={createSession.isPending}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetTime">Target Time (optional)</Label>
                <Input
                  id="targetTime"
                  type="text"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  placeholder="e.g., 3:30:00, 1:45:00"
                  disabled={createSession.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (optional)</Label>
                <Input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Boston, MA"
                  disabled={createSession.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={createSession.isPending}
                  placeholder="Add any additional notes about the race..."
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
                  Add Race
                </Button>
              </DialogFooter>
            </form>
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
