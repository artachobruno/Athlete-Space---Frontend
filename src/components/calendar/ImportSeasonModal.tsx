import { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, FileText } from 'lucide-react';
import { createManualSeason } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SessionData {
  date: string;
  type: 'easy' | 'workout' | 'long' | 'rest' | 'threshold' | 'vo2' | 'tempo' | 'recovery' | 'race' | 'cross';
  distance_km?: number | null;
  duration_minutes?: number | null;
  notes?: string | null;
}

interface ImportSeasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportSeasonModal({ open, onOpenChange, onSuccess }: ImportSeasonModalProps) {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'json' | 'form'>('json');

  const parseJsonSessions = (input: string): { sessions: SessionData[]; error: string | null } => {
    if (!input.trim()) {
      return { sessions: [], error: null };
    }

    try {
      const parsed = JSON.parse(input);
      
      // Handle array of sessions
      if (Array.isArray(parsed)) {
        const sessions: SessionData[] = [];
        for (const item of parsed) {
          if (typeof item !== 'object' || item === null) {
            throw new Error('Each session must be an object');
          }
          
          if (!item.date || typeof item.date !== 'string') {
            throw new Error('Each session must have a date (YYYY-MM-DD)');
          }
          
          if (!item.type || !['easy', 'workout', 'long', 'rest', 'threshold', 'vo2', 'tempo', 'recovery', 'race', 'cross'].includes(item.type)) {
            throw new Error('Each session must have a valid type');
          }

          sessions.push({
            date: item.date,
            type: item.type,
            distance_km: item.distance_km ?? null,
            duration_minutes: item.duration_minutes ?? null,
            notes: item.notes ?? null,
          });
        }
        return { sessions, error: null };
      }

      // Handle object with sessions array
      if (typeof parsed === 'object' && 'sessions' in parsed && Array.isArray(parsed.sessions)) {
        const sessions: SessionData[] = [];
        for (const item of parsed.sessions) {
          if (typeof item !== 'object' || item === null) {
            throw new Error('Each session must be an object');
          }
          
          if (!item.date || typeof item.date !== 'string') {
            throw new Error('Each session must have a date (YYYY-MM-DD)');
          }
          
          if (!item.type || !['easy', 'workout', 'long', 'rest', 'threshold', 'vo2', 'tempo', 'recovery', 'race', 'cross'].includes(item.type)) {
            throw new Error('Each session must have a valid type');
          }

          sessions.push({
            date: item.date,
            type: item.type,
            distance_km: item.distance_km ?? null,
            duration_minutes: item.duration_minutes ?? null,
            notes: item.notes ?? null,
          });
        }
        return { sessions, error: null };
      }

      throw new Error('JSON must be an array of sessions or an object with a sessions array');
    } catch (err) {
      if (err instanceof Error) {
        return { sessions: [], error: err.message };
      }
      return { sessions: [], error: 'Invalid JSON format' };
    }
  };

  const parsedResult = useMemo(() => {
    if (activeTab === 'form') {
      return { sessions: [], error: null };
    }
    return parseJsonSessions(jsonInput);
  }, [jsonInput, activeTab]);

  const parsedSessions = parsedResult.sessions;

  // Update error state when parsing result changes
  useEffect(() => {
    setJsonError(parsedResult.error);
  }, [parsedResult.error]);

  const previewStats = useMemo(() => {
    if (parsedSessions.length === 0) {
      return { sessionsCount: 0, weeksCount: 0 };
    }

    // Count unique weeks (week start dates)
    const weekStarts = new Set<string>();
    for (const session of parsedSessions) {
      const date = new Date(session.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      weekStarts.add(weekStart.toISOString().split('T')[0]);
    }

    return {
      sessionsCount: parsedSessions.length,
      weeksCount: weekStarts.size,
    };
  }, [parsedSessions]);

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setJsonInput(text);
      }
    };
    reader.onerror = () => {
      setJsonError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    setSubmitError(null);

    if (activeTab === 'json') {
      if (parsedSessions.length === 0) {
        setSubmitError('No valid sessions to import');
        return;
      }

      if (parsedSessions.length > 500) {
        setSubmitError('Cannot import more than 500 sessions at once');
        return;
      }
    } else {
      // Form mode not implemented yet
      setSubmitError('Form mode not yet implemented');
      return;
    }

    setIsSubmitting(true);

    try {
      await createManualSeason(parsedSessions);

      toast({
        title: 'Season imported',
        description: `${parsedSessions.length} session(s) have been imported to your calendar.`,
      });

      // Reset form
      setJsonInput('');
      setJsonError(null);
      setSubmitError(null);

      // Close modal and refresh calendar
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error('Failed to import season:', err);
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
        setSubmitError('Failed to import sessions. Please try again or refresh.');
      } else {
        // Try to extract a meaningful error message
        const errorMessage = apiError.response?.data?.message || apiError.response?.data?.detail || apiError.message || 'Failed to import season';
        setSubmitError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setJsonError(null);
      setSubmitError(null);
      onOpenChange(false);
    }
  };

  const canSubmit = parsedSessions.length > 0 && parsedSessions.length <= 500 && !jsonError;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Season</DialogTitle>
          <DialogDescription>
            Import multiple training sessions from JSON. This will create many sessions in your calendar.
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900">
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Warning:</strong> This will create many sessions. Make sure your data is correct before importing.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'json' | 'form')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="json">JSON Upload</TabsTrigger>
            <TabsTrigger value="form" disabled>Form (Coming Soon)</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="json-file">Upload JSON File (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="json-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonFileUpload}
                  disabled={isSubmitting}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="json-input">Or paste JSON</Label>
              <Textarea
                id="json-input"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                disabled={isSubmitting}
                placeholder='[{"date": "2024-01-01", "type": "easy", "distance_km": 10}, ...]'
                rows={12}
                className="font-mono text-sm"
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
            </div>

            {parsedSessions.length > 0 && (
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <h4 className="font-semibold text-sm">Preview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sessions:</span>
                    <span className="ml-2 font-semibold">{previewStats.sessionsCount}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Weeks:</span>
                    <span className="ml-2 font-semibold">{previewStats.weeksCount}</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Form-based import coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        {submitError && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import Season ({parsedSessions.length} session{parsedSessions.length !== 1 ? 's' : ''})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
