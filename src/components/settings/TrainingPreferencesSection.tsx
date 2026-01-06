import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Settings2, Save } from 'lucide-react';

const sports = [
  { id: 'running', label: 'Running' },
  { id: 'cycling', label: 'Cycling' },
  { id: 'swimming', label: 'Swimming' },
  { id: 'triathlon', label: 'Triathlon' },
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function TrainingPreferencesSection() {
  const [preferences, setPreferences] = useState({
    primarySports: ['running', 'cycling'],
    trainingDays: [true, false, true, true, false, true, true],
    hoursPerWeek: 10,
    trainingFocus: 'race',
    hasInjuryHistory: false,
    injuryNotes: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const toggleSport = (sportId: string) => {
    setPreferences(prev => ({
      ...prev,
      primarySports: prev.primarySports.includes(sportId)
        ? prev.primarySports.filter(s => s !== sportId)
        : [...prev.primarySports, sportId],
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
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  };

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
        {/* Primary Sports */}
        <div className="space-y-3">
          <Label>Primary Sports</Label>
          <div className="flex flex-wrap gap-3">
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => toggleSport(sport.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  preferences.primarySports.includes(sport.id)
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-muted/50 text-muted-foreground border-border hover:border-accent/50'
                }`}
              >
                {sport.label}
              </button>
            ))}
          </div>
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
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
