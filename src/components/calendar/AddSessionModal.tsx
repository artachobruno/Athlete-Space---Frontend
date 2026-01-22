import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUnitSystem } from '@/hooks/useUnitSystem';
import { format } from 'date-fns';
import { useCreatePlannedSession } from '@/hooks/useCalendarMutations';
import { parseWorkoutNotes, type ParsedWorkout } from '@/lib/api';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ParsedWorkoutPreview } from './ParsedWorkoutPreview';
import { FEATURES } from '@/lib/features';
import { useNavigate } from 'react-router-dom';

interface AddSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

type ParseStatus = 'idle' | 'parsing' | 'unavailable' | 'ambiguous' | 'ok';

export function AddSessionModal({ open, onOpenChange, initialDate, onSuccess }: AddSessionModalProps) {
  const { unitSystem } = useUnitSystem();
  const createSession = useCreatePlannedSession();
  const navigate = useNavigate();
  const [date, setDate] = useState(initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));
  const [sport, setSport] = useState<'Run' | 'Bike' | 'Swim' | 'Triathlon' | 'Crossfit' | 'Strength' | 'Walk' | ''>('');
  const [type, setType] = useState<'easy' | 'workout' | 'long' | 'rest' | 'threshold' | 'vo2' | 'tempo' | 'recovery' | 'race' | 'cross' | ''>('');
  const [distanceInput, setDistanceInput] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [parseStatus, setParseStatus] = useState<ParseStatus>('idle');
  const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Get distance unit label based on user's unit system
  const distanceUnit = unitSystem === 'imperial' ? 'mi' : 'km';

  const handlePreviewSteps = async () => {
    if (!FEATURES.workoutNotesParsing) {
      return;
    }

    if (!type || type === 'rest' || !notes.trim()) {
      setParseStatus('idle');
      setParsedWorkout(null);
      return;
    }

    setParseStatus('parsing');
    
    try {
      // Convert distance for parsing
      let distanceKm: number | null = null;
      if (distanceInput) {
        const distanceValue = parseFloat(distanceInput);
        if (!isNaN(distanceValue) && distanceValue > 0) {
          if (unitSystem === 'imperial') {
            distanceKm = distanceValue / 0.621371;
          } else {
            distanceKm = distanceValue;
          }
        }
      }

      const duration = durationMinutes ? parseInt(durationMinutes, 10) : null;
      const result = await parseWorkoutNotes(
        notes,
        type as 'easy' | 'workout' | 'long' | 'rest' | 'threshold' | 'vo2' | 'tempo' | 'recovery' | 'race' | 'cross',
        distanceKm,
        duration && !isNaN(duration) && duration > 0 ? duration : null
      );

      setParsedWorkout(result);
      
      // Map backend response to UI status
      // Backend returns: success boolean, workout, error, confidence
      // We map to: ok, unavailable, ambiguous based on the response
      if (result.success && result.workout) {
        setParseStatus('ok');
        setWarnings([]);
      } else if (result.error) {
        // If there's an error message, treat as ambiguous (warning state)
        setParseStatus('ambiguous');
        setWarnings([result.error]);
      } else {
        setParseStatus('unavailable');
        setWarnings([]);
      }
    } catch (err) {
      console.info('Workout notes parsing unavailable');
      setParseStatus('unavailable');
      setParsedWorkout(null);
      setWarnings([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation: sport is required
    if (!sport) {
      setError('Sport type is required');
      return;
    }

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
        sport,
        type,
        distance_km: distanceKm,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: (session) => {
          toast({
            title: 'Session added',
            description: 'The session has been added to your calendar.',
          });

          // Reset form
          setSport('');
          setType('');
          setDistanceInput('');
          setDurationMinutes('');
          setNotes('');
          setError(null);
          setParseStatus('idle');
          setParsedWorkout(null);
          setWarnings([]);

          // Close modal
          // Note: Query invalidation is handled by useCreatePlannedSession hook
          onOpenChange(false);
          onSuccess?.(); // Call for any additional side effects (if needed)

          // Redirect to workout detail page if workout_id exists
          // Note: Parsing happens asynchronously on the backend, so workout_id
          // may not be available immediately. This is fine - the user can navigate
          // to the workout page later when parsing completes.
          if (session.workout_id) {
            navigate(`/workout/${session.workout_id}`);
          }
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
          
          // Handle 500 errors with user-friendly message
          if (apiError.response?.status === 500) {
            setError('Failed to create session. Please try again or refresh.');
            return;
          }
          
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

  const showParsingUI = FEATURES.workoutNotesParsing && type && type !== 'rest' && notes.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="p-0 bg-transparent border-none sm:max-w-[500px]">
        <GlassCard variant="raised" className="rounded-2xl">
          <div className="p-6">
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
            <Label htmlFor="sport">Sport *</Label>
            <Select value={sport} onValueChange={(value) => setSport(value as 'Run' | 'Bike' | 'Swim' | 'Triathlon' | 'Crossfit' | 'Strength' | 'Walk')} disabled={createSession.isPending}>
              <SelectTrigger id="sport">
                <SelectValue placeholder="Select sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Run">Run</SelectItem>
                <SelectItem value="Bike">Bike</SelectItem>
                <SelectItem value="Swim">Swim</SelectItem>
                <SelectItem value="Triathlon">Triathlon</SelectItem>
                <SelectItem value="Crossfit">Crossfit</SelectItem>
                <SelectItem value="Strength">Strength</SelectItem>
                <SelectItem value="Walk">Walk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Session Type *</Label>
            <Select value={type} onValueChange={(value) => setType(value as 'easy' | 'workout' | 'long' | 'rest' | 'threshold' | 'vo2' | 'tempo' | 'recovery' | 'race' | 'cross')} disabled={createSession.isPending}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select session type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="workout">Workout</SelectItem>
                <SelectItem value="long">Long</SelectItem>
                <SelectItem value="threshold">Threshold</SelectItem>
                <SelectItem value="vo2">VO2</SelectItem>
                <SelectItem value="tempo">Tempo</SelectItem>
                <SelectItem value="recovery">Recovery</SelectItem>
                <SelectItem value="race">Race</SelectItem>
                <SelectItem value="cross">Cross</SelectItem>
                <SelectItem value="rest">Rest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Examples:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>3 miles warm up, 4x1 mile lt2 with 1 mile flow</li>
                <li>10 min easy, 3x5 min threshold with 2 min recovery</li>
                <li>20 min warmup, 2x20 min sweet spot, 10 min cooldown</li>
              </ul>
            </div>

            {/* Parsing UI - only shown when feature flag is enabled */}
            {showParsingUI && (
              <div className="mt-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewSteps}
                  disabled={createSession.isPending || parseStatus === 'parsing'}
                >
                  {parseStatus === 'parsing' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    'Preview structured steps'
                  )}
                </Button>

                {/* Parsing Status Indicator */}
                {parseStatus === 'parsing' && (
                  <Alert>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <AlertDescription>Parsing workout notes...</AlertDescription>
                  </Alert>
                )}

                {parseStatus === 'ok' && parsedWorkout?.workout && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Structured workout preview available
                    </AlertDescription>
                  </Alert>
                )}

                {parseStatus === 'ambiguous' && warnings.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      {warnings[0]}
                    </AlertDescription>
                  </Alert>
                )}

                {parseStatus === 'unavailable' && (
                  <Alert className="border-muted bg-muted/30">
                    <AlertDescription className="text-muted-foreground">
                      Structured steps preview isn't available yet. You can still save this session.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Workout Step Visualization */}
                {parseStatus === 'ok' && parsedWorkout && parsedWorkout.workout && (
                  <ParsedWorkoutPreview parsedWorkout={parsedWorkout} />
                )}
              </div>
            )}
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
          </div>
        </GlassCard>
      </DialogContent>
    </Dialog>
  );
}
