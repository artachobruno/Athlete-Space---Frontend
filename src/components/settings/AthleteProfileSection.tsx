import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { User, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchUserProfile, updateUserProfile, fetchSettingsProfile, updateSettingsProfile } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useAthleteProfile } from '@/hooks/useAthleteProfile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';

interface ProfileState {
  name: string;
  email: string;
  gender: string;
  weight: string;
  unitSystem: 'imperial' | 'metric';
  location: string;
  dateOfBirth?: string;
  heightFeet?: string;
  heightInches?: string;
}

// Format number to 1 decimal place max
const format1Decimal = (value: number): number => {
  return Number(value.toFixed(1));
};

export function AthleteProfileSection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { 
    profile: athleteProfile, 
    bioSource, 
    isBioStale,
    bioText,
    confirmBio,
    isConfirmingBio,
    hasBio
  } = useAthleteProfile();
  const [profile, setProfile] = useState<ProfileState>({
    name: '',
    email: user?.email || '',
    gender: '',
    weight: '',
    unitSystem: 'imperial',
    location: '',
    dateOfBirth: '',
    heightFeet: '',
    heightInches: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialProfile, setInitialProfile] = useState<ProfileState | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  // Update email when user changes (from auth context)
  useEffect(() => {
    if (user?.email) {
      setProfile((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email]);

  useEffect(() => {
    if (initialProfile) {
      // Normalize data for comparison (handle empty strings, undefined, null)
      const normalize = (obj: ProfileState): ProfileState => ({
        name: obj.name || '',
        email: obj.email || '',
        gender: obj.gender || '',
        weight: obj.weight || '',
        unitSystem: obj.unitSystem || 'imperial',
        location: obj.location || '',
        dateOfBirth: obj.dateOfBirth || '',
        heightFeet: obj.heightFeet || '',
        heightInches: obj.heightInches || '',
      });
      const normalizedProfile = normalize(profile);
      const normalizedInitial = normalize(initialProfile);
      const changed = JSON.stringify(normalizedProfile) !== JSON.stringify(normalizedInitial);
      setHasChanges(changed);
    } else {
      // If initialProfile is not set yet, no changes can exist
      setHasChanges(false);
    }
  }, [profile, initialProfile]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await fetchUserProfile();
      
      // Email comes from auth context (useAuth), not from profile
      const emailFromAuth = user?.email || '';
      
      // Handle null response (profile is optional)
      if (!userProfile) {
        console.log('Profile not available - user may need to complete onboarding');
        // Set default empty profile with email from auth
        const defaultProfile: ProfileState = {
          name: '',
          email: emailFromAuth,
          gender: '',
          weight: '',
          unitSystem: 'imperial',
          location: '',
          dateOfBirth: '',
          heightFeet: '',
          heightInches: '',
        };
        setProfile(defaultProfile);
        setInitialProfile(defaultProfile);
        setIsLoading(false);
        return;
      }
      
      // FE-A3: Default to Imperial unless user explicitly changes
      // Backend returns weight_kg/weight_lbs, height_cm/height_in, date_of_birth, unit_system
      const backendUnitSystem = (userProfile as { unit_system?: 'imperial' | 'metric' }).unit_system || (userProfile as { unitSystem?: 'imperial' | 'metric' }).unitSystem;
      // If unit_system is missing → default to "imperial"
      const unitSystem = backendUnitSystem || 'imperial';
      
      // Get weight - backend may return weight_kg (metric) or weight_lbs (imperial)
      const weightKg = (userProfile as { weight_kg?: number }).weight_kg;
      const weightLbs = (userProfile as { weight_lbs?: number }).weight_lbs;
      let displayWeight = '';
      if (weightLbs !== undefined && weightLbs !== null) {
        // Backend already provided weight in lbs
        displayWeight = format1Decimal(weightLbs).toString();
      } else if (weightKg !== undefined && weightKg !== null) {
        // Convert from kg to lbs for imperial, or use kg for metric
        const weightValue = unitSystem === 'metric' ? weightKg : format1Decimal(weightKg / 0.453592);
        displayWeight = weightValue.toString();
      }
      
      // Get height - backend may return height_cm (metric) or height_in (imperial)
      const heightCm = (userProfile as { height_cm?: number }).height_cm;
      const heightIn = (userProfile as { height_in?: number }).height_in;
      let heightFeet = '';
      let heightInches = '';
      if (heightIn !== undefined && heightIn !== null) {
        // Backend already provided height in inches - convert to feet/inches
        const totalInches = format1Decimal(heightIn);
        heightFeet = Math.floor(totalInches / 12).toString();
        heightInches = (totalInches % 12).toFixed(0);
      } else if (heightCm !== undefined && heightCm !== null) {
        // Convert from cm to inches for imperial, or use cm for metric
        if (unitSystem === 'imperial') {
          const totalInches = format1Decimal(heightCm / 2.54);
          heightFeet = Math.floor(totalInches / 12).toString();
          heightInches = (totalInches % 12).toFixed(0);
        } else {
          // Metric: display in cm (but we still need to handle this if needed)
          // For now, metric height is not supported in this component per requirements
          const totalInches = format1Decimal(heightCm / 2.54);
          heightFeet = Math.floor(totalInches / 12).toString();
          heightInches = (totalInches % 12).toFixed(0);
        }
      }
      
      // Map backend gender format (M/F) to frontend format
      const backendGender = (userProfile as { gender?: string }).gender || '';
      const displayGender = backendGender === 'M' || backendGender === 'F' ? backendGender : '';
      
      const profileData: ProfileState = {
        name: (userProfile as { name?: string }).name || '',
        email: emailFromAuth, // Always use email from auth context
        gender: displayGender,
        weight: displayWeight,
        unitSystem,
        location: (userProfile as { location?: string }).location || '',
        dateOfBirth: (userProfile as { date_of_birth?: string }).date_of_birth || (userProfile as { dateOfBirth?: string }).dateOfBirth || '',
        heightFeet,
        heightInches,
      };
      setProfile(profileData);
      setInitialProfile(profileData);
    } catch (error) {
      // Check if it's a CORS error
      const isCorsError = error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK';
      
      if (!isCorsError) {
        console.error('Failed to load profile:', error);
      }
      
      const errorMessage = isCorsError
        ? 'Unable to connect to the server. Please check your connection or try again later.'
        : (error instanceof Error ? error.message : 'Could not load your profile data');
      
      toast({
        title: 'Failed to load profile',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const weightUnit = profile.unitSystem === 'metric' ? 'kg' : 'lbs';

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Get current profile to preserve target_event and goals (they're managed in TrainingPreferencesSection)
      // fetchUserProfile now returns null on failure (it's optional)
      const currentProfile = await fetchUserProfile();

      const updateData: Partial<import('@/types').AthleteProfile> = {
        name: profile.name,
        // Email is NOT included in save payload - it comes from /me (auth context) only
        gender: profile.gender === 'not-specified' ? '' : profile.gender,
        location: profile.location,
        unitSystem: profile.unitSystem,
      };

      // Preserve target_event and goals from current profile (they're edited in TrainingPreferencesSection)
      if (currentProfile) {
        if (currentProfile.target_event) {
          updateData.targetEvent = currentProfile.target_event;
        }
        if (currentProfile.goals && currentProfile.goals.length > 0) {
          updateData.goals = currentProfile.goals;
        }
      }

      // Handle weight - send weight_lbs for imperial, weight_kg for metric (1 decimal max)
      if (profile.weight) {
        const weightValue = parseFloat(profile.weight);
        if (!isNaN(weightValue)) {
          const formattedWeight = format1Decimal(weightValue);
          if (profile.unitSystem === 'imperial') {
            // Send weight_lbs for imperial (1 decimal max)
            (updateData as { weight_lbs?: number }).weight_lbs = formattedWeight;
          } else {
            // Send weight_kg for metric (1 decimal max)
            (updateData as { weight_kg?: number }).weight_kg = formattedWeight;
          }
        }
      }

      if (profile.dateOfBirth) {
        updateData.dateOfBirth = profile.dateOfBirth;
      }

      // Handle height - convert feet+inches to total inches for imperial, or cm for metric (1 decimal max)
      if (profile.heightFeet || profile.heightInches) {
        const feet = parseFloat(profile.heightFeet || '0');
        const inches = parseFloat(profile.heightInches || '0');
        if (!isNaN(feet) && !isNaN(inches)) {
          if (profile.unitSystem === 'imperial') {
            // Convert feet + inches to total inches (1 decimal max)
            const totalInches = feet * 12 + inches;
            (updateData as { height_in?: number }).height_in = format1Decimal(totalInches);
          } else {
            // For metric, convert to cm (feet and inches inputs are used, but convert to cm for backend)
            const totalInches = feet * 12 + inches;
            const heightCm = format1Decimal(totalInches * 2.54);
            (updateData as { height_cm?: number }).height_cm = heightCm;
          }
        }
      }

      // Save to backend and get updated response
      const updatedProfile = await updateUserProfile(updateData);
      
      // Update local state from backend response
      if (updatedProfile) {
        const unitSystem = (updatedProfile as { unit_system?: 'imperial' | 'metric' }).unit_system || 
                          (updatedProfile as { unitSystem?: 'imperial' | 'metric' }).unitSystem || 
                          'imperial';
        
        // Get weight from response
        const weightLbs = (updatedProfile as { weight_lbs?: number }).weight_lbs;
        const weightKg = (updatedProfile as { weight_kg?: number }).weight_kg;
        let displayWeight = '';
        if (weightLbs !== undefined && weightLbs !== null) {
          displayWeight = format1Decimal(weightLbs).toString();
        } else if (weightKg !== undefined && weightKg !== null) {
          const weightValue = unitSystem === 'metric' ? weightKg : format1Decimal(weightKg / 0.453592);
          displayWeight = weightValue.toString();
        }
        
        // Get height from response
        const heightIn = (updatedProfile as { height_in?: number }).height_in;
        const heightCm = (updatedProfile as { height_cm?: number }).height_cm;
        let heightFeet = '';
        let heightInches = '';
        if (heightIn !== undefined && heightIn !== null) {
          const totalInches = format1Decimal(heightIn);
          heightFeet = Math.floor(totalInches / 12).toString();
          heightInches = (totalInches % 12).toFixed(0);
        } else if (heightCm !== undefined && heightCm !== null) {
          const totalInches = format1Decimal(heightCm / 2.54);
          heightFeet = Math.floor(totalInches / 12).toString();
          heightInches = (totalInches % 12).toFixed(0);
        }
        
        const backendGender = (updatedProfile as { gender?: string }).gender || '';
        const displayGender = backendGender === 'M' || backendGender === 'F' ? backendGender : '';
        
        const updatedState: ProfileState = {
          name: (updatedProfile as { name?: string }).name || '',
          email: user?.email || '', // Always use email from auth context
          gender: displayGender,
          weight: displayWeight,
          unitSystem,
          location: (updatedProfile as { location?: string }).location || '',
          dateOfBirth: (updatedProfile as { date_of_birth?: string }).date_of_birth || 
                      (updatedProfile as { dateOfBirth?: string }).dateOfBirth || '',
          heightFeet,
          heightInches,
        };
        
        setProfile(updatedState);
        setInitialProfile(updatedState);
      } else {
        // If no response, just update initial profile to current state
        setInitialProfile({ ...profile });
      }
      
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
      <GlassCard>
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
      </GlassCard>
    );
  }

  // Build badge text based on bio source
  const getBadgeText = () => {
    if (!bioSource) {
      return null;
    }
    
    if (bioSource === 'ai_generated') {
      // Check if we can get last updated date from profile
      if (isBioStale) {
        return 'AI-derived profile · Update available';
      }
      // For now, just show base text (we can add date later if available in API response)
      return 'AI-derived profile';
    }
    
    if (bioSource === 'user_edited') {
      return 'Profile customized by you';
    }
    
    if (isBioStale) {
      return 'AI-derived profile · Update available';
    }
    
    return null;
  };

  const badgeText = getBadgeText();

  return (
    <GlassCard>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <User className="h-5 w-5 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Athlete Profile</CardTitle>
                {badgeText && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs">
                          {badgeText}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          This profile is generated from your training data and settings. You can edit or regenerate it anytime.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <CardDescription>Your personal information and physical attributes</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Athlete Bio */}
        {hasBio && bioText && (
          <div className="p-4 bg-accent/5 border border-accent/20 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {bioText}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {bioSource === 'ai_generated' && (
                  <Badge variant="outline" className="text-xs">
                    AI Generated
                  </Badge>
                )}
                {bioSource === 'ai_generated' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmBio({})}
                    disabled={isConfirmingBio}
                    className="h-8 w-8 p-0"
                    title="Confirm bio"
                  >
                    {isConfirmingBio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Name, Email, and Role */}
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
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Email cannot be changed here. Use the Privacy & Security section to change your email.
            </p>
          </div>
        </div>

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={user?.role || 'athlete'}
            onValueChange={async (value: 'athlete' | 'coach') => {
              try {
                await updateSettingsProfile({ role: value });
                toast({
                  title: 'Role updated',
                  description: `Your role has been changed to ${value}.`,
                });
                // Refresh user context
                window.location.reload(); // Simple refresh to update auth context
              } catch (error) {
                console.error('Failed to update role:', error);
                toast({
                  title: 'Error',
                  description: 'Failed to update role. Please try again.',
                  variant: 'destructive',
                });
              }
            }}
          >
            <SelectTrigger id="role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="athlete">🏃 Athlete</SelectItem>
              <SelectItem value="coach">🎓 Coach</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Your role determines which features are available to you.</p>
        </div>

        {/* Gender, Weight, Height, Date of Birth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profile.gender || 'not-specified'}
              onValueChange={(value) => setProfile({ ...profile, gender: value === 'not-specified' ? '' : value })}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Not specified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-specified">Not specified</SelectItem>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
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
                step="0.1"
                value={profile.weight}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value && value !== '-') {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      setProfile({ ...profile, weight: format1Decimal(numValue).toString() });
                    }
                  }
                }}
                className="flex-1"
                placeholder="0.0"
              />
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                {weightUnit}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <div className="flex gap-2">
              <div className="flex gap-1 flex-1">
                <Input
                  id="heightFeet"
                  type="number"
                  min="0"
                  value={profile.heightFeet || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '-') {
                      setProfile({ ...profile, heightFeet: value });
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        setProfile({ ...profile, heightFeet: numValue.toString() });
                      } else if (value === '') {
                        setProfile({ ...profile, heightFeet: '' });
                      }
                    }
                  }}
                  className="flex-1"
                  placeholder="0"
                />
                <span className="flex items-center px-2 text-sm text-muted-foreground">ft</span>
                <Input
                  id="heightInches"
                  type="number"
                  min="0"
                  max="11"
                  value={profile.heightInches || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === '-') {
                      setProfile({ ...profile, heightInches: value });
                    } else {
                      const numValue = parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 11) {
                        setProfile({ ...profile, heightInches: numValue.toString() });
                      } else if (value === '') {
                        setProfile({ ...profile, heightInches: '' });
                      }
                    }
                  }}
                  className="flex-1"
                  placeholder="0"
                />
                <span className="flex items-center px-2 text-sm text-muted-foreground">in</span>
              </div>
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
    </GlassCard>
  );
}
