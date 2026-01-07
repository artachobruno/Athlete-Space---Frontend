import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Settings2, Save, Loader2 } from 'lucide-react';
import { fetchTrainingPreferences, updateTrainingPreferences } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import type { Sport } from '@/types';

const sports = [
  { id: 'running', label: 'Running' },
  { id: 'cycling', label: 'Cycling' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'triathlon', label: 'Triathlon' },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface PreferencesState {
  primarySports: Sport[];
  trainingDays: boolean[];
  hoursPerWeek: number;
  trainingFocus: 'race' | 'general';
  hasInjuryHistory: boolean;
  injuryNotes: string;
  trainingAge?: number;
}

export function TrainingPreferencesSection() {
  const [preferences, setPreferences] = useState<PreferencesState>({
    primarySports: [],
    trainingDays: [true, true, true, true, true, true, true],
    hoursPerWeek: 10,
    trainingFocus: 'general',
    hasInjuryHistory: false,
    injuryNotes: '',
    trainingAge: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialPreferences, setInitialPreferences] = useState<PreferencesState | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    if (initialPreferences) {
      const changed = JSON.stringify(preferences) !== JSON.stringify(initialPreferences);
      setHasChanges(changed);
    }
  }, [preferences, initialPreferences]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const prefs = await fetchTrainingPreferences();
      
      // Convert available_days array (["Mon", "Tue", ...]) to boolean array
      const trainingDaysArray = weekDays.map(day => prefs.available_days.includes(day));
      
      // Map training_focus: "race_focused" -> "race", "general_fitness" -> "general"
      const trainingFocus: 'race' | 'general' = prefs.training_focus === 'race_focused' ? 'race' : 'general';
      
      const prefsData: PreferencesState = {
        primarySports: prefs.primary_sports as Sport[],
        trainingDays: trainingDaysArray,
        hoursPerWeek: prefs.weekly_hours,
        trainingFocus,
        hasInjuryHistory: prefs.injury_history,
        injuryNotes: '', // Not in backend API response
        trainingAge: prefs.years_of_training,
      };
      setPreferences(prefsData);
      setInitialPreferences(prefsData);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast({
        title: 'Failed to load preferences',
        description: error instanceof Error ? error.message : 'Could not load your training preferences',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSport = (sportId: string) => {
    setPreferences(prev => ({
      ...prev,
      primarySports: prev.primarySports.includes(sportId as Sport)
        ? prev.primarySports.filter(s => s !== sportId) as Sport[]
        : [...prev.primarySports, sportId as Sport],
    }));
  };

  const toggleDay = (index: number) => {
    setPreferences(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.map((d, i) => (i === index ? !d : d)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert trainingDays boolean array to available_days string array
      const availableDays = weekDays.filter((_, index) => preferences.trainingDays[index]);
      
      // Map trainingFocus: "race" -> "race_focused", "general" -> "general_fitness"
      const trainingFocus: 'race_focused' | 'general_fitness' = preferences.trainingFocus === 'race' ? 'race_focused' : 'general_fitness';

      await updateTrainingPreferences({
        years_of_training: preferences.trainingAge,
        primary_sports: preferences.primarySports,
        available_days: availableDays,
        weekly_hours: preferences.hoursPerWeek,
        training_focus: trainingFocus,
        injury_history: preferences.hasInjuryHistory,
      });

      setInitialPreferences({ ...preferences });
      setHasChanges(false);
      toast({
        title: 'Preferences updated',
        description: 'Your training preferences have been saved successfully',
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: 'Failed to save preferences',
        description: error instanceof Error ? error.message : 'Could not save your preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Settings2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Training Preferences</CardTitle>
              <CardDescription>Configure how the coach structures your training</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Settings2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Training Preferences</CardTitle>
            <CardDescription>Configure how the coach structures your training</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Training Age */}
        <div className="space-y-3">
          <Label htmlFor="trainingAge">Years of Structured Training</Label>
          <div className="flex items-center gap-4">
            <Slider
              value={[preferences.trainingAge || 0]}
              onValueChange={([value]) => setPreferences({ ...preferences, trainingAge: value })}
              min={0}
              max={30}
              step={1}
              className="flex-1"
            />
            <span className="text-sm font-medium text-foreground min-w-[3rem] text-right">
              {preferences.trainingAge || 0} years
            </span>
          </div>
        </div>

        {/* Primary Sports */}
        <div className="space-y-3">
          <Label>Primary Sports</Label>
          <div className="flex flex-wrap gap-3">
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => toggleSport(sport.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  preferences.primarySports.includes(sport.id as Sport)
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-muted/50 text-muted-foreground border-border hover:border-accent/50'
                }`}
              >
                {sport.label}
              </button>
            ))}
          </div>
          {preferences.primarySports.length === 0 && (
            <p className="text-xs text-muted-foreground">Select at least one sport</p>
          )}
        </div>

        {/* Available Training Days */}
        <div className="space-y-3">
          <Label>Available Training Days</Label>
          <div className="flex gap-2">
            {weekDays.map((day, index) => (
              <button
                key={day}
                onClick={() => toggleDay(index)}
                className={`w-12 h-12 rounded-lg border text-sm font-medium transition-colors ${
                  preferences.trainingDays[index]
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-muted/50 text-muted-foreground border-border hover:border-accent/50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {preferences.trainingDays.filter(Boolean).length} days selected
          </p>
        </div>

        {/* Hours Per Week */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Weekly Training Hours</Label>
            <span className="text-sm font-medium text-foreground">
              {preferences.hoursPerWeek} hours
            </span>
          </div>
          <Slider
            value={[preferences.hoursPerWeek]}
            onValueChange={([value]) => setPreferences({ ...preferences, hoursPerWeek: value })}
            min={3}
            max={25}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 hrs</span>
            <span>25 hrs</span>
          </div>
        </div>

        {/* Training Focus */}
        <div className="space-y-3">
          <Label>Training Focus</Label>
          <RadioGroup
            value={preferences.trainingFocus}
            onValueChange={(value) => setPreferences({ ...preferences, trainingFocus: value })}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                preferences.trainingFocus === 'race'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <RadioGroupItem value="race" className="mt-0.5" />
              <div>
                <div className="font-medium text-foreground">Race Focused</div>
                <p className="text-sm text-muted-foreground">
                  Training structured around specific race goals and dates
                </p>
              </div>
            </label>
            <label
              className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                preferences.trainingFocus === 'general'
                  ? 'border-accent bg-accent/5'
                  : 'border-border hover:border-accent/50'
              }`}
            >
              <RadioGroupItem value="general" className="mt-0.5" />
              <div>
                <div className="font-medium text-foreground">General Fitness</div>
                <p className="text-sm text-muted-foreground">
                  Flexible training focused on overall fitness and consistency
                </p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Injury History */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch
              id="injury-history"
              checked={preferences.hasInjuryHistory}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, hasInjuryHistory: checked })
              }
            />
            <Label htmlFor="injury-history" className="cursor-pointer">
              I have injury history or limitations to consider
            </Label>
          </div>
          {preferences.hasInjuryHistory && (
            <Textarea
              placeholder="Describe any injuries, limitations, or areas of concern..."
              value={preferences.injuryNotes}
              onChange={(e) => setPreferences({ ...preferences, injuryNotes: e.target.value })}
              className="min-h-[80px]"
            />
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges || preferences.primarySports.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
