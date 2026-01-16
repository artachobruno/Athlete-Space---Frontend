import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format, startOfWeek, addDays, eachDayOfInterval } from 'date-fns';
import { useCreatePlannedWeek } from '@/hooks/useCalendarMutations';

type UnitSystem = 'imperial' | 'metric';

interface SessionFormData {
  sport: 'Run' | 'Bike' | 'Swim' | 'Triathlon' | 'Crossfit' | 'Strength' | 'Walk' | '';
  type: 'easy' | 'workout' | 'long' | 'rest' | '';
  distance: string;
  duration_minutes: string;
  notes: string;
}

interface DaySession {
  date: string;
  sessions: SessionFormData[];
}

interface AddWeekModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  onSuccess?: () => void;
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function AddWeekModal({ open, onOpenChange, initialDate, onSuccess }: AddWeekModalProps) {
  const createWeek = useCreatePlannedWeek();
  const weekStart = useMemo(() => {
    if (initialDate) {
      return startOfWeek(initialDate, { weekStartsOn: 1 });
    }
    return startOfWeek(new Date(), { weekStartsOn: 1 });
  }, [initialDate]);

  const weekDates = useMemo(() => {
    return eachDayOfInterval({
      start: weekStart,
      end: addDays(weekStart, 6),
    });
  }, [weekStart]);

  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');

  const [daySessions, setDaySessions] = useState<DaySession[]>(() => {
    return weekDates.map((date) => ({
      date: format(date, 'yyyy-MM-dd'),
      sessions: [],
    }));
  });

  const [error, setError] = useState<string | null>(null);

  const addSessionToDay = (dateStr: string) => {
    setDaySessions((prev) => {
      return prev.map((day) => {
        if (day.date === dateStr) {
          return {
            ...day,
            sessions: [
              ...day.sessions,
              {
                sport: '',
                type: '',
                distance: '',
                duration_minutes: '',
                notes: '',
              },
            ],
          };
        }
        return day;
      });
    });
  };

  const removeSessionFromDay = (dateStr: string, index: number) => {
    setDaySessions((prev) => {
      return prev.map((day) => {
        if (day.date === dateStr) {
          return {
            ...day,
            sessions: day.sessions.filter((_, i) => i !== index),
          };
        }
        return day;
      });
    });
  };

  const updateSession = (dateStr: string, sessionIndex: number, field: keyof SessionFormData, value: string) => {
    setDaySessions((prev) => {
      return prev.map((day) => {
        if (day.date === dateStr) {
          return {
            ...day,
            sessions: day.sessions.map((session, i) => {
              if (i === sessionIndex) {
                return { ...session, [field]: value };
              }
              return session;
            }),
          };
        }
        return day;
      });
    });
  };

  const validateAndPrepareSessions = (): Array<{
    date: string;
    sport: 'Run' | 'Bike' | 'Swim' | 'Triathlon' | 'Crossfit' | 'Strength' | 'Walk';
    type: 'easy' | 'workout' | 'long' | 'rest';
    distance_km?: number | null;
    duration_minutes?: number | null;
    notes?: string | null;
  }> => {
    const sessions: Array<{
      date: string;
      sport: 'Run' | 'Bike' | 'Swim' | 'Triathlon' | 'Crossfit' | 'Strength' | 'Walk';
      type: 'easy' | 'workout' | 'long' | 'rest';
      distance_km?: number | null;
      duration_minutes?: number | null;
      notes?: string | null;
    }> = [];

    for (const day of daySessions) {
      for (const session of day.sessions) {
        // Skip empty sessions (sport and type are required)
        if (!session.sport || !session.type) {
          continue;
        }

        // Validate: either distance or duration must be provided (except for rest)
        if (session.type !== 'rest' && !session.distance && !session.duration_minutes) {
          throw new Error(`Session on ${format(new Date(day.date), 'MMM d')} is missing distance or duration`);
        }

        // Validate distance if provided
        if (session.distance && (isNaN(parseFloat(session.distance)) || parseFloat(session.distance) <= 0)) {
          throw new Error(`Invalid distance on ${format(new Date(day.date), 'MMM d')}`);
        }

        // Validate duration if provided
        if (session.duration_minutes && (isNaN(parseInt(session.duration_minutes, 10)) || parseInt(session.duration_minutes, 10) <= 0)) {
          throw new Error(`Invalid duration on ${format(new Date(day.date), 'MMM d')}`);
        }

        // Convert distance to km for API
        let distance_km: number | null = null;
        if (session.distance) {
          const distanceValue = parseFloat(session.distance);
          if (unitSystem === 'imperial') {
            // Convert miles to km (1 mile = 1.60934 km)
            distance_km = distanceValue * 1.60934;
          } else {
            // Already in km
            distance_km = distanceValue;
          }
        }

        sessions.push({
          date: day.date,
          sport: session.sport as 'Run' | 'Bike' | 'Swim' | 'Triathlon' | 'Crossfit' | 'Strength' | 'Walk',
          type: session.type,
          distance_km: distance_km,
          duration_minutes: session.duration_minutes ? parseInt(session.duration_minutes, 10) : null,
          notes: session.notes.trim() || null,
        });
      }
    }

    return sessions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const sessions = validateAndPrepareSessions();

      // Check session count
      if (sessions.length > 500) {
        setError('Cannot submit more than 500 sessions at once');
        return;
      }

      if (sessions.length === 0) {
        setError('Please add at least one session');
        return;
      }

      createWeek.mutate(
        {
          weekStart: format(weekStart, 'yyyy-MM-dd'),
          sessions,
        },
        {
          onSuccess: () => {
            toast({
              title: 'Week added',
              description: `${sessions.length} session(s) have been added to your calendar.`,
            });

            // Reset form
            setDaySessions(
              weekDates.map((date) => ({
                date: format(date, 'yyyy-MM-dd'),
                sessions: [],
              }))
            );
            setError(null);

            // Close modal and refresh calendar
            onOpenChange(false);
            onSuccess?.();
          },
          onError: (err) => {
            console.error('Failed to create week:', err);
            const apiError = err as { 
              message?: string; 
              response?: { 
                status?: number;
                data?: { 
                  message?: string; 
                  detail?: string;
                } 
              } 
            };
            
            // Handle 500 errors with user-friendly message
            if (apiError.response?.status === 500) {
              setError('Failed to create sessions. Please try again or refresh.');
              return;
            }
            
            // Try to extract a meaningful error message
            if (err instanceof Error) {
              setError(err.message);
            } else {
              const errorMessage = apiError.response?.data?.message || apiError.response?.data?.detail || apiError.message || 'Failed to create week';
              setError(errorMessage);
            }
          },
        }
      );
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while validating sessions');
      }
    }
  };

  const handleClose = () => {
    if (!createWeek.isPending) {
      setError(null);
      onOpenChange(false);
    }
  };

  const totalSessions = useMemo(() => {
    return daySessions.reduce((sum, day) => sum + day.sessions.length, 0);
  }, [daySessions]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Week</DialogTitle>
          <DialogDescription>
            Add training sessions for the week of {format(weekStart, 'MMM d, yyyy')}. You can add multiple sessions per day.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <Label htmlFor="unit-select" className="text-sm font-medium">
              Unit System
            </Label>
            <Select
              value={unitSystem}
              onValueChange={(value: UnitSystem) => setUnitSystem(value)}
              disabled={createWeek.isPending}
            >
              <SelectTrigger id="unit-select" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="imperial">Imperial (miles)</SelectItem>
                <SelectItem value="metric">Metric (km)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-4">
            {weekDates.map((date, dayIndex) => {
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayData = daySessions.find((d) => d.date === dateStr);
              const sessions = dayData?.sessions || [];

              return (
                <div key={dateStr} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{weekDays[dayIndex]}</h3>
                      <p className="text-sm text-muted-foreground">{format(date, 'MMM d, yyyy')}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSessionToDay(dateStr)}
                      disabled={createWeek.isPending}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Session
                    </Button>
                  </div>

                  {sessions.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No sessions added</p>
                  )}

                  {sessions.map((session, sessionIndex) => (
                    <div key={sessionIndex} className="bg-muted/50 rounded-lg p-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Sport *</Label>
                            <Select
                              value={session.sport}
                              onValueChange={(value) => updateSession(dateStr, sessionIndex, 'sport', value)}
                              disabled={createWeek.isPending}
                            >
                              <SelectTrigger>
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

                          <div className="space-y-1">
                            <Label className="text-xs">Type *</Label>
                            <Select
                              value={session.type}
                              onValueChange={(value) => updateSession(dateStr, sessionIndex, 'type', value)}
                              disabled={createWeek.isPending}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="workout">Workout</SelectItem>
                                <SelectItem value="long">Long</SelectItem>
                                <SelectItem value="rest">Rest</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">
                              Distance ({unitSystem === 'imperial' ? 'miles' : 'km'})
                            </Label>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              value={session.distance}
                              onChange={(e) => updateSession(dateStr, sessionIndex, 'distance', e.target.value)}
                              disabled={createWeek.isPending || session.type === 'rest'}
                              placeholder="Optional"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Duration (min)</Label>
                            <Input
                              type="number"
                              step="1"
                              min="0"
                              value={session.duration_minutes}
                              onChange={(e) => updateSession(dateStr, sessionIndex, 'duration_minutes', e.target.value)}
                              disabled={createWeek.isPending || session.type === 'rest'}
                              placeholder="Optional"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Notes</Label>
                            <Input
                              value={session.notes}
                              onChange={(e) => updateSession(dateStr, sessionIndex, 'notes', e.target.value)}
                              disabled={createWeek.isPending}
                              placeholder="Optional"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSessionFromDay(dateStr, sessionIndex)}
                          disabled={createWeek.isPending}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Total sessions: {totalSessions} {totalSessions > 500 && <span className="text-destructive">(max 500)</span>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={createWeek.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWeek.isPending || totalSessions === 0 || totalSessions > 500}>
              {createWeek.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Week ({totalSessions} session{totalSessions !== 1 ? 's' : ''})
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
