import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AthleteProfileSection() {
  const [profile, setProfile] = useState({
    name: 'Alex Thompson',
    email: 'alex@example.com',
    gender: 'male',
    weight: '159',
    unitSystem: 'imperial' as 'imperial' | 'metric',
    location: 'San Francisco, CA',
  });

  // Convert weight based on unit system
  const displayWeight = profile.unitSystem === 'metric' 
    ? Math.round(parseFloat(profile.weight) * 0.453592) 
    : profile.weight;
  const weightUnit = profile.unitSystem === 'metric' ? 'kg' : 'lbs';

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsSaving(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <User className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Athlete Profile</CardTitle>
            <CardDescription>Your personal information and physical attributes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
        </div>

        {/* Gender and Weight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender}
              onValueChange={(value) => setProfile({ ...profile, gender: value })}
            >
              <SelectTrigger id="gender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="weight">Weight</Label>
              <Badge variant="outline" className="text-xs font-normal">
                From Strava
              </Badge>
            </div>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                value={displayWeight}
                onChange={(e) => {
                  const value = e.target.value;
                  // Store in lbs internally
                  const inLbs = profile.unitSystem === 'metric' 
                    ? Math.round(parseFloat(value) / 0.453592).toString()
                    : value;
                  setProfile({ ...profile, weight: inLbs });
                }}
                className="flex-1"
              />
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                {weightUnit}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="location">Location</Label>
              <Badge variant="outline" className="text-xs font-normal">
                From Strava
              </Badge>
            </div>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            />
          </div>
        </div>

        {/* Unit System */}
        <div className="space-y-3">
          <Label>Unit System</Label>
          <RadioGroup
            value={profile.unitSystem}
            onValueChange={(value) => setProfile({ ...profile, unitSystem: value as 'imperial' | 'metric' })}
            className="flex gap-3"
          >
            <label
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all flex-1',
                profile.unitSystem === 'imperial'
                  ? 'border-accent bg-accent/5 ring-1 ring-accent'
                  : 'border-border hover:border-accent/50'
              )}
            >
              <RadioGroupItem value="imperial" />
              <div>
                <div className="font-medium text-foreground">Imperial</div>
                <p className="text-xs text-muted-foreground">miles, feet, lbs</p>
              </div>
            </label>
            <label
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-all flex-1',
                profile.unitSystem === 'metric'
                  ? 'border-accent bg-accent/5 ring-1 ring-accent'
                  : 'border-border hover:border-accent/50'
              )}
            >
              <RadioGroupItem value="metric" />
              <div>
                <div className="font-medium text-foreground">Metric</div>
                <p className="text-xs text-muted-foreground">km, meters, kg</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
