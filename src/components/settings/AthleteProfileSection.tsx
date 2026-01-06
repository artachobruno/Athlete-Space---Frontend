import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchUserProfile, updateUserProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileState {
  name: string;
  email: string;
  gender: string;
  weight: string;
  unitSystem: 'imperial' | 'metric';
  location: string;
  dateOfBirth?: string;
  height?: string;
}

export function AthleteProfileSection() {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<ProfileState>({
    name: '',
    email: '',
    gender: '',
    weight: '',
    unitSystem: 'imperial',
    location: '',
    dateOfBirth: '',
    height: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialProfile, setInitialProfile] = useState<ProfileState | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (initialProfile) {
      const changed = JSON.stringify(profile) !== JSON.stringify(initialProfile);
      setHasChanges(changed);
    }
  }, [profile, initialProfile]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await fetchUserProfile();
      const profileData: ProfileState = {
        name: userProfile.name || '',
        email: (userProfile as { email?: string }).email || '',
        gender: (userProfile as { gender?: string }).gender || '',
        weight: (userProfile as { weight?: number | string }).weight?.toString() || '',
        unitSystem: (userProfile as { unitSystem?: 'imperial' | 'metric' }).unitSystem || 'imperial',
        location: (userProfile as { location?: string }).location || '',
        dateOfBirth: (userProfile as { dateOfBirth?: string }).dateOfBirth || '',
        height: (userProfile as { height?: number | string }).height?.toString() || '',
      };
      setProfile(profileData);
      setInitialProfile(profileData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast({
        title: 'Failed to load profile',
        description: error instanceof Error ? error.message : 'Could not load your profile data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Convert weight based on unit system
  const displayWeight = profile.unitSystem === 'metric' && profile.weight
    ? Math.round(parseFloat(profile.weight) * 0.453592).toString()
    : profile.weight;
  const weightUnit = profile.unitSystem === 'metric' ? 'kg' : 'lbs';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updateData: Record<string, unknown> = {
        name: profile.name,
        email: profile.email,
        gender: profile.gender,
        location: profile.location,
        unitSystem: profile.unitSystem,
      };

      if (profile.weight) {
        const weightValue = profile.unitSystem === 'metric'
          ? Math.round(parseFloat(profile.weight) / 0.453592).toString()
          : profile.weight;
        updateData.weight = parseFloat(weightValue);
      }

      if (profile.dateOfBirth) {
        updateData.dateOfBirth = profile.dateOfBirth;
      }

      if (profile.height) {
        updateData.height = parseFloat(profile.height);
      }

      await updateUserProfile(updateData);
      setInitialProfile({ ...profile });
      setHasChanges(false);
      // Invalidate queries to update unit system across the app
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully',
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: 'Failed to save profile',
        description: error instanceof Error ? error.message : 'Could not save your profile',
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
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <CardTitle className="text-lg">Athlete Profile</CardTitle>
              <CardDescription>Your personal information and physical attributes</CardDescription>
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

        {/* Gender, Weight, Height, Date of Birth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender || ''}
              onValueChange={(value) => setProfile({ ...profile, gender: value })}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not specified</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={profile.dateOfBirth || ''}
              onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                value={displayWeight}
                onChange={(e) => {
                  const value = e.target.value;
                  const inLbs = profile.unitSystem === 'metric' 
                    ? (value ? Math.round(parseFloat(value) / 0.453592).toString() : '')
                    : value;
                  setProfile({ ...profile, weight: inLbs });
                }}
                className="flex-1"
                placeholder="0"
              />
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                {weightUnit}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <div className="flex gap-2">
              <Input
                id="height"
                type="number"
                value={profile.height || ''}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
                className="flex-1"
                placeholder="0"
              />
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                {profile.unitSystem === 'metric' ? 'cm' : 'in'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profile.location}
              onChange={(e) => setProfile({ ...profile, location: e.target.value })}
              placeholder="City, State/Country"
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
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
