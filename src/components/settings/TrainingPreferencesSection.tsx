import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings2, Save, Loader2 } from 'lucide-react';
import { fetchTrainingPreferences, updateTrainingPreferences, updateUserProfile, fetchUserProfile } from '@/lib/api';
import { auth } from '@/lib/auth';
import { getStoredProfile, getOnboardingAdditionalData, saveProfile, saveOnboardingAdditionalData } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import type { Sport } from '@/types';

const sports = [
  { id: 'running', label: 'Running' },
  { id: 'cycling', label: 'Cycling' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'triathlon', label: 'Triathlon' },
];

const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const weekDaysDisplay = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // For UI display

interface PreferencesState {
  primarySports: Sport[];
  trainingDays: boolean[];
  hoursPerWeek: number;
  trainingFocus: 'race' | 'general';
  hasInjuryHistory: boolean;
  injuryNotes: string;
  trainingAge?: number;
  // Additional onboarding fields
  consistency: string;
  goal: string;
  raceDetails: string;
  targetEventName: string;
  targetEventDate: string;
}

const consistencyOptions = [
  'Just getting started',
  'Training occasionally',
  'Training consistently',
  'Structured training for years',
];

export function TrainingPreferencesSection() {
  const [preferences, setPreferences] = useState<PreferencesState>({
    primarySports: [],
    trainingDays: [true, true, true, true, true, true, true],
    hoursPerWeek: 10,
    trainingFocus: 'general',
    hasInjuryHistory: false,
    injuryNotes: '',
    trainingAge: 0,
    consistency: '',
    goal: '',
    raceDetails: '',
    targetEventName: '',
    targetEventDate: '',
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
    } else {
      // If initialPreferences is not set yet, no changes can exist
      setHasChanges(false);
    }
  }, [preferences, initialPreferences]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      // Load from backend if authenticated
      let backendPrefs = null;
      let backendProfile = null;
      if (auth.isLoggedIn()) {
        try {
          // fetchUserProfile now returns null on failure (it's optional)
          [backendPrefs, backendProfile] = await Promise.all([
            fetchTrainingPreferences().catch(() => null),
            fetchUserProfile(),
          ]);
        } catch (error) {
          // If backend fails, continue with local data
          console.warn('Failed to load from backend, using local data:', error);
        }
      }

      // Load from local storage as fallback
      const profile = getStoredProfile();
      const additionalData = getOnboardingAdditionalData();

      // Use backend data if available, otherwise fall back to local
      const effectiveProfile = backendProfile || profile;
      
      // Convert available_days array (backend uses lowercase: ["monday", "tuesday", ...]) to boolean array
      const trainingDaysArray = backendPrefs
        ? weekDays.map(day => {
            // Backend may return lowercase full names or abbreviated, handle both
            const dayLower = day.toLowerCase();
            return backendPrefs.available_days.some(d => 
              d.toLowerCase() === dayLower || 
              d.toLowerCase() === dayLower.substring(0, 3)
            );
          })
        : effectiveProfile
        ? weekDays.map((_, index) => index < (effectiveProfile.weeklyAvailability?.days || 0))
        : [true, true, true, true, true, true, true];
      
      // Map training_focus: "race_focused" -> "race", "general_fitness" -> "general"
      const trainingFocus: 'race' | 'general' = backendPrefs
        ? (backendPrefs.training_focus === 'race_focused' ? 'race' : 'general')
        : effectiveProfile?.goals && effectiveProfile.goals.some(g => g.toLowerCase().includes('race'))
        ? 'race'
        : 'general';

      // Extract goal - prefer backend, then profile, then additional data
      const goal = backendPrefs?.goal || effectiveProfile?.goals?.[0] || '';

      // Extract target event - prefer backend profile, then local profile
      const targetEventName = effectiveProfile?.targetEvent?.name || '';
      const targetEventDate = effectiveProfile?.targetEvent?.date || '';
      
      const prefsData: PreferencesState = {
        primarySports: (backendPrefs?.primary_sports as Sport[]) || effectiveProfile?.sports || [],
        trainingDays: trainingDaysArray,
        hoursPerWeek: backendPrefs?.weekly_hours || effectiveProfile?.weeklyAvailability?.hoursPerWeek || 10,
        trainingFocus,
        hasInjuryHistory: backendPrefs?.injury_history || false,
        injuryNotes: backendPrefs?.injury_notes || additionalData?.injuryDetails || '',
        trainingAge: backendPrefs?.years_of_training || effectiveProfile?.trainingAge || 0,
        consistency: backendPrefs?.consistency || additionalData?.consistency || '',
        goal,
        raceDetails: additionalData?.raceDetails || '',
        targetEventName,
        targetEventDate,
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
      // Save to backend if authenticated
      if (auth.isLoggedIn()) {
    try {
      // Convert trainingDays boolean array to available_days string array
      const availableDays = weekDays.filter((_, index) => preferences.trainingDays[index]);
      
      // Map trainingFocus: "race" -> "race_focused", "general" -> "general_fitness"
      const trainingFocus: 'race_focused' | 'general_fitness' = preferences.trainingFocus === 'race' ? 'race_focused' : 'general_fitness';

          // Save training preferences
      await updateTrainingPreferences({
        years_of_training: preferences.trainingAge,
        primary_sports: preferences.primarySports,
        available_days: availableDays,
        weekly_hours: preferences.hoursPerWeek,
        training_focus: trainingFocus,
        injury_history: preferences.hasInjuryHistory,
            injury_notes: preferences.injuryNotes || null,
            consistency: preferences.consistency || null,
            goal: preferences.goal || null,
          });

          // Save target_event and goals to profile (backend now supports these)
          const profileUpdate: Partial<import('@/types').AthleteProfile> = {};
          
          // Update target_event if provided
          if (preferences.targetEventName || preferences.targetEventDate) {
            profileUpdate.targetEvent = {
              name: preferences.targetEventName,
              date: preferences.targetEventDate,
            };
          } else if (preferences.trainingFocus !== 'race') {
            // Clear target_event if not race-focused
            profileUpdate.targetEvent = null;
          }
          
          // Update goals array
          if (preferences.goal) {
            profileUpdate.goals = [preferences.goal];
          }

          // Only update profile if we have changes
          if (Object.keys(profileUpdate).length > 0) {
            await updateUserProfile(profileUpdate);
          }
        } catch (error) {
          console.error('Failed to save to backend:', error);
          // Continue to save locally even if backend fails
        }
      }

      // Always save to local storage
      const profile = getStoredProfile() || {
        id: 'local',
        name: '',
        sports: [],
        trainingAge: 0,
        weeklyAvailability: { days: 0, hoursPerWeek: 0 },
        goals: [],
        stravaConnected: false,
        onboardingComplete: true,
      };

      // Update profile with new data
      const updatedProfile = {
        ...profile,
        sports: preferences.primarySports,
        trainingAge: preferences.trainingAge || 0,
        weeklyAvailability: {
          days: preferences.trainingDays.filter(Boolean).length,
          hoursPerWeek: preferences.hoursPerWeek,
        },
        goals: preferences.goal ? [preferences.goal] : [],
        targetEvent: preferences.targetEventName || preferences.targetEventDate
          ? {
              name: preferences.targetEventName,
              date: preferences.targetEventDate,
            }
          : undefined,
      };
      saveProfile(updatedProfile);

      // Save additional onboarding data
      const additionalData = {
        consistency: preferences.consistency,
        raceDetails: preferences.raceDetails || (preferences.targetEventName ? `${preferences.targetEventName}${preferences.targetEventDate ? ` - ${preferences.targetEventDate}` : ''}` : ''),
        injuryDetails: preferences.injuryNotes,
        collectedAt: new Date().toISOString(),
      };
      saveOnboardingAdditionalData(additionalData);

      setInitialPreferences({ ...preferences });
      setHasChanges(false);
      toast({
        title: 'Preferences updated',
        description: auth.isLoggedIn()
          ? 'Your training preferences have been saved successfully'
          : 'Your preferences have been saved locally. Connect Strava to sync with the backend.',
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
        {/* Training Consistency */}
        <div className="space-y-3">
          <Label htmlFor="consistency">Training Consistency</Label>
          <Select
            value={preferences.consistency}
            onValueChange={(value) => setPreferences({ ...preferences, consistency: value })}
          >
            <SelectTrigger id="consistency">
              <SelectValue placeholder="Select your training consistency" />
            </SelectTrigger>
            <SelectContent>
              {consistencyOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
            {weekDaysDisplay.map((day, index) => (
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

        {/* Training Goal */}
        <div className="space-y-3">
          <Label htmlFor="goal">Primary Training Goal</Label>
          <Input
            id="goal"
            value={preferences.goal}
            onChange={(e) => setPreferences({ ...preferences, goal: e.target.value })}
            placeholder="e.g., Complete a marathon, Improve fitness, Return to training"
          />
        </div>

        {/* Training Focus */}
        <div className="space-y-3">
          <Label>Training Focus</Label>
          <RadioGroup
            value={preferences.trainingFocus}
            onValueChange={(value: 'general' | 'race') => setPreferences({ ...preferences, trainingFocus: value })}
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

        {/* Target Event / Race Details */}
        {preferences.trainingFocus === 'race' && (
          <div className="space-y-3">
            <Label>Target Event / Race</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetEventName" className="text-sm">Event Name</Label>
                <Input
                  id="targetEventName"
                  value={preferences.targetEventName}
                  onChange={(e) => setPreferences({ ...preferences, targetEventName: e.target.value })}
                  placeholder="e.g., Boston Marathon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetEventDate" className="text-sm">Event Date</Label>
                <Input
                  id="targetEventDate"
                  type="date"
                  value={preferences.targetEventDate}
                  onChange={(e) => setPreferences({ ...preferences, targetEventDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="raceDetails" className="text-sm">Additional Race Details</Label>
              <Textarea
                id="raceDetails"
                value={preferences.raceDetails}
                onChange={(e) => setPreferences({ ...preferences, raceDetails: e.target.value })}
                placeholder="Any additional details about your target event..."
                className="min-h-[80px]"
              />
            </div>
          </div>
        )}

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
