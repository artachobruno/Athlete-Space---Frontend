import { useState, useEffect, useRef } from 'react';
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

/**
 * AthleteProfileSection - Profile form component
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH: Profile form state hydrates ONLY from /me/profile
 * 
 * - AuthContext.user (from /me) is used ONLY for email (identity field)
 * - All other profile fields (name, weight, height, etc.) come from /me/profile
 * - NEVER re-initialize profile form from AuthContext.user
 * 
 * This separation prevents the "profile fields cleared after save" bug.
 */
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
  
  // Guard to prevent reloading profile after save
  // This prevents the form from being cleared when /me is called after save
  const justSavedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  
  // CRITICAL: Guard to prevent double saves and save loops
  // Saves MUST ONLY happen on explicit user action (button click)
  // NEVER on state changes, useEffect, or hydration
  const isSavingRef = useRef(false);

  useEffect(() => {
    // ⚠️ FORM INITIALIZATION RULE: Forms should initialize ONCE unless explicitly reset
    // 
    // This ensures:
    // 1. Profile loads only on mount (not after saves or auth refreshes)
    // 2. Form state persists through /me calls and auth context updates
    // 3. No race conditions between save and reload
    //
    // DO NOT weaken this guard - it prevents the "fields cleared after save" bug
    if (!hasLoadedRef.current) {
      loadProfile();
      hasLoadedRef.current = true;
    }
  }, []);

  // Update email when user changes (from auth context)
  // CRITICAL: Only update email, never reload profile from /me
  // The /me endpoint does not contain profile fields, so we must never
  // re-initialize the profile form from the auth context user object
  useEffect(() => {
    if (user?.email && !justSavedRef.current) {
      // Only update email if we haven't just saved (to avoid race conditions)
      setProfile((prev) => ({ ...prev, email: user.email || prev.email }));
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
    // CRITICAL: Never reload profile if we just saved
    // This prevents the form from being cleared when /me is called after save
    if (justSavedRef.current) {
      console.log('[Profile] Skipping loadProfile - profile was just saved (guard active)');
      return;
    }
    
    // CRITICAL: Never reload if a save is in progress
    // This prevents race conditions where save completes but reload happens first
    if (isSavingRef.current) {
      console.log('[Profile] Skipping loadProfile - save in progress');
      return;
    }
    
    setIsLoading(true);
    try {
      // CRITICAL: Always fetch from /me/profile, NEVER from /me
      // The /me endpoint only contains auth fields (id, email, role, etc.)
      // Profile fields (name, weight, height, etc.) come from /me/profile
      // 
      // SINGLE SOURCE OF TRUTH: Profile form state MUST ONLY hydrate from /me/profile
      // NEVER from AuthContext.user (which comes from /me)
      const userProfile = await fetchUserProfile();
      
      // Email comes from auth context (useAuth), not from profile
      // But we only use it if profile doesn't have email (defensive)
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
      
      // DEFENSIVE: Assert we have a valid profile response
      // This prevents accidental hydration from malformed responses
      if (typeof userProfile !== 'object') {
        console.warn('[Profile] Invalid profile response type, skipping hydration');
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
      
      // Get height - backend may return height_cm (metric) or height_inches (imperial)
      // CRITICAL: Backend returns height_inches (integer), not height_in
      const heightCm = (userProfile as { height_cm?: number }).height_cm;
      const heightInchesBackend = (userProfile as { height_inches?: number }).height_inches;
      // Also check for height_in for backward compatibility
      const heightIn = (userProfile as { height_in?: number }).height_in;
      let heightFeet = '';
      let heightInches = '';
      
      // Backend returns height_inches (integer) for imperial
      const totalInchesValue = heightInchesBackend ?? heightIn;
      if (totalInchesValue !== undefined && totalInchesValue !== null) {
        // Backend already provided height in inches - convert to feet/inches
        const totalInches = format1Decimal(totalInchesValue);
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
      // CRITICAL: Use nullish coalescing to distinguish null from empty string
      const backendGender = (userProfile as { gender?: string | null }).gender;
      const displayGender = (backendGender === 'M' || backendGender === 'F') ? backendGender : '';
      
      // CRITICAL: Backend returns full_name, not name
      // Handle both full_name and name for backward compatibility
      // Check if field exists in response (undefined vs null)
      const hasFullName = 'full_name' in userProfile;
      const hasName = 'name' in userProfile;
      const backendName = hasFullName 
        ? (userProfile as { full_name?: string | null }).full_name 
        : hasName
        ? (userProfile as { name?: string | null }).name
        : undefined;
      
      // Check if location exists in response
      const hasLocation = 'location' in userProfile;
      const backendLocation = hasLocation 
        ? (userProfile as { location?: string | null }).location 
        : undefined;
      
      // Check if date_of_birth exists in response
      const hasDateOfBirth = 'date_of_birth' in userProfile || 'dateOfBirth' in userProfile;
      const backendDateOfBirth = hasDateOfBirth
        ? ((userProfile as { date_of_birth?: string | null }).date_of_birth 
           ?? (userProfile as { dateOfBirth?: string | null }).dateOfBirth)
        : undefined;
      
      // CRITICAL: When loading profile, always use backend values if they exist
      // If backend returns null, that means the field was explicitly cleared - use empty string
      // If backend field is undefined (not in response), use empty string as default
      // DO NOT preserve current form state during load - backend is source of truth
      // This ensures the form reflects what's actually saved in the backend
      const profileData: ProfileState = {
        // Use backend value if it exists (even if null), otherwise use empty string
        // Backend null means field was cleared, so use empty string in form
        name: backendName !== undefined ? (backendName || '') : '',
        email: emailFromAuth, // Always use email from auth context
        gender: displayGender,
        weight: displayWeight,
        unitSystem,
        location: backendLocation !== undefined ? (backendLocation || '') : '',
        dateOfBirth: backendDateOfBirth !== undefined ? (backendDateOfBirth || '') : '',
        heightFeet,
        heightInches,
      };
      
      console.log('[Profile] Name resolution during load:', {
        hasFullName,
        hasName,
        backendName,
        finalName: profileData.name,
        backendHasField: backendName !== undefined,
      });
      
      // Log loaded profile data for debugging
      console.log('[Profile] Loaded profile data:', {
        name: profileData.name,
        weight: profileData.weight,
        height: `${profileData.heightFeet}'${profileData.heightInches}"`,
        location: profileData.location,
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        unitSystem: profileData.unitSystem,
        rawBackendResponse: userProfile, // Log full backend response for debugging
        backendNameField: (userProfile as { full_name?: string | null }).full_name,
        backendNameFieldAlt: (userProfile as { name?: string | null }).name,
      });
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

  /**
   * handleSave - Explicit save handler
   * 
   * ⚠️ CRITICAL: Saves MUST ONLY happen on explicit user action (button click)
   * 
   * This function is NEVER called by:
   * - useEffect hooks
   * - State change watchers
   * - Auto-save logic
   * - Form submission handlers
   * - Profile hydration
   * 
   * Multiple guards prevent:
   * - Double saves (isSavingRef)
   * - Save loops (justSavedRef)
   * - Saves during hydration (hasLoadedRef)
   */
  const handleSave = async () => {
    // CRITICAL: Prevent double saves and save loops
    // This ensures saves ONLY happen on explicit user action
    if (isSavingRef.current) {
      console.log('[Profile] Save already in progress, ignoring duplicate save request');
      return;
    }
    
    // Block saves during hydration (form not ready)
    if (!hasLoadedRef.current) {
      console.warn('[Profile] Attempted to save before profile loaded, ignoring');
      return;
    }
    
    // Block saves immediately after a save (prevent loops)
    if (justSavedRef.current) {
      console.log('[Profile] Save blocked - profile was just saved');
      return;
    }
    
    isSavingRef.current = true;
    setIsSaving(true);
    
    try {
      // Get current profile to preserve target_event and goals (they're managed in TrainingPreferencesSection)
      // fetchUserProfile now returns null on failure (it's optional)
      const currentProfile = await fetchUserProfile();

      // Build update payload with all fields from the form
      // CRITICAL: Always send ALL fields explicitly, even if empty
      // This ensures the backend knows what to update/clear
      const trimmedName = profile.name.trim();
      const trimmedLocation = profile.location.trim();
      
      const updateData: Partial<import('@/types').AthleteProfile> = {
        // CRITICAL: Send name as full_name for backend
        // Send the trimmed value if it exists, otherwise null to clear
        // CRITICAL: Only send null if the field is actually empty (user cleared it)
        // If the field has any content (even whitespace that was trimmed), send it
        name: trimmedName || null,
        // Email is NOT included in save payload - it comes from /me (auth context) only
        gender: profile.gender === 'not-specified' || profile.gender === '' ? null : profile.gender,
        location: trimmedLocation || null,
        unitSystem: profile.unitSystem,
      };
      
      // Log the raw profile state before processing
      console.log('[Profile] Raw profile state before save:', {
        name: profile.name,
        nameLength: profile.name.length,
        nameTrimmed: trimmedName,
        location: profile.location,
        locationTrimmed: trimmedLocation,
      });
      
      // Log what we're sending for debugging
      console.log('[Profile] Saving profile data:', {
        name: updateData.name,
        gender: updateData.gender,
        location: updateData.location,
        unitSystem: updateData.unitSystem,
        weight: profile.weight,
        heightFeet: profile.heightFeet,
        heightInches: profile.heightInches,
        dateOfBirth: profile.dateOfBirth,
        fullPayload: updateData, // Log full payload
      });

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
      // CRITICAL: Always send weight, even if empty (send null to clear)
      if (profile.weight && profile.weight.trim() !== '') {
        const weightValue = parseFloat(profile.weight);
        if (!isNaN(weightValue) && weightValue > 0) {
          const formattedWeight = format1Decimal(weightValue);
          if (profile.unitSystem === 'imperial') {
            // Send weight_lbs for imperial (1 decimal max)
            (updateData as { weight_lbs?: number }).weight_lbs = formattedWeight;
            // Clear weight_kg when using imperial
            (updateData as { weight_kg?: number }).weight_kg = null;
          } else {
            // Send weight_kg for metric (1 decimal max)
            (updateData as { weight_kg?: number }).weight_kg = formattedWeight;
            // Clear weight_lbs when using metric
            (updateData as { weight_lbs?: number }).weight_lbs = null;
          }
        }
      } else {
        // Explicitly clear weight if field is empty
        (updateData as { weight_lbs?: number }).weight_lbs = null;
        (updateData as { weight_kg?: number }).weight_kg = null;
      }

      // CRITICAL: Always send dateOfBirth, even if empty (send null to clear)
      updateData.dateOfBirth = profile.dateOfBirth && profile.dateOfBirth.trim() !== '' 
        ? profile.dateOfBirth 
        : null;

      // Handle height - convert feet+inches to total inches for imperial, or cm for metric
      // CRITICAL: Backend expects height_inches (integer) for imperial, height_cm (integer) for metric
      // CRITICAL: Always send height, even if empty (send null to clear)
      const hasHeightFeet = profile.heightFeet && profile.heightFeet.trim() !== '';
      const hasHeightInches = profile.heightInches && profile.heightInches.trim() !== '';
      
      if (hasHeightFeet || hasHeightInches) {
        const feet = parseFloat(profile.heightFeet || '0');
        const inches = parseFloat(profile.heightInches || '0');
        if (!isNaN(feet) && !isNaN(inches) && (feet > 0 || inches > 0)) {
          if (profile.unitSystem === 'imperial') {
            // Convert feet + inches to total inches (integer for backend)
            const totalInches = Math.round(feet * 12 + inches);
            (updateData as { height_inches?: number }).height_inches = totalInches;
            // Also send height_in for backward compatibility (will be converted by updateUserProfile)
            (updateData as { height_in?: number }).height_in = totalInches;
            // Clear height_cm when using imperial
            (updateData as { height_cm?: number }).height_cm = null;
          } else {
            // For metric, convert to cm (integer for backend)
            const totalInches = feet * 12 + inches;
            const heightCm = Math.round(totalInches * 2.54);
            (updateData as { height_cm?: number }).height_cm = heightCm;
            // Clear height_inches when using metric
            (updateData as { height_inches?: number }).height_inches = null;
          }
        } else {
          // Explicitly clear height if values are invalid
          (updateData as { height_inches?: number }).height_inches = null;
          (updateData as { height_cm?: number }).height_cm = null;
        }
      } else {
        // Explicitly clear height if fields are empty
        (updateData as { height_inches?: number }).height_inches = null;
        (updateData as { height_cm?: number }).height_cm = null;
      }

      // CRITICAL: Set flag to prevent profile reload after save
      // This prevents the form from being cleared when /me is called
      justSavedRef.current = true;
      
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
        // CRITICAL: Backend returns height_inches (integer), not height_in
        const heightInchesBackend = (updatedProfile as { height_inches?: number }).height_inches;
        const heightIn = (updatedProfile as { height_in?: number }).height_in;
        const heightCm = (updatedProfile as { height_cm?: number }).height_cm;
        let heightFeet = '';
        let heightInches = '';
        
        // Backend returns height_inches (integer) for imperial
        const totalInchesValue = heightInchesBackend ?? heightIn;
        if (totalInchesValue !== undefined && totalInchesValue !== null) {
          const totalInches = format1Decimal(totalInchesValue);
          heightFeet = Math.floor(totalInches / 12).toString();
          heightInches = (totalInches % 12).toFixed(0);
        } else if (heightCm !== undefined && heightCm !== null) {
          const totalInches = format1Decimal(heightCm / 2.54);
          heightFeet = Math.floor(totalInches / 12).toString();
          heightInches = (totalInches % 12).toFixed(0);
        }
        
        const backendGender = (updatedProfile as { gender?: string }).gender || '';
        const displayGender = backendGender === 'M' || backendGender === 'F' ? backendGender : '';
        
        // CRITICAL: Backend returns full_name, not name
        // Handle both full_name and name for backward compatibility
        const backendName = (updatedProfile as { full_name?: string | null }).full_name 
          ?? (updatedProfile as { name?: string | null }).name 
          ?? null;
        
        // CRITICAL: Always prefer what we just sent to the backend over the response
        // The response might be incomplete or the backend might not return all fields correctly
        // We know what we saved, so use that as the source of truth
        const savedName = profile.name.trim();
        // If backend returns null but we sent a non-empty name, use what we sent
        // This is a workaround for backend bugs where it doesn't return the saved value
        // CRITICAL: If backend returns null but we sent a name, the backend likely has a bug
        // but we should still preserve what we sent in the form state
        const backendNameTrimmed = backendName ? backendName.trim() : '';
        const finalName = backendNameTrimmed || savedName || '';
        
        console.log('[Profile] Name resolution after save:', {
          backendName,
          backendNameTrimmed,
          savedName,
          finalName,
          profileName: profile.name,
          backendReturnedNull: backendName === null,
          backendReturnedEmpty: backendNameTrimmed === '',
          weSentName: !!savedName,
          warning: backendName === null && savedName ? 'Backend returned null but we sent a name - backend bug!' : null,
        });
        
        // CRITICAL: Use the values we JUST SENT to the backend, not the response
        // The response might be incomplete or buggy, but we know what we saved
        // This ensures the form shows exactly what was saved, even if backend doesn't return it
        const updatedState: ProfileState = {
          // Use what we sent if backend returns null/empty, otherwise use backend response
          name: finalName,
          email: user?.email || profile.email || '', // Always use email from auth context
          gender: displayGender || profile.gender || '',
          weight: displayWeight || profile.weight || '',
          unitSystem: unitSystem || profile.unitSystem || 'imperial',
          location: (updatedProfile as { location?: string }).location ?? profile.location ?? '',
          dateOfBirth: (updatedProfile as { date_of_birth?: string }).date_of_birth || 
                      (updatedProfile as { dateOfBirth?: string }).dateOfBirth || 
                      profile.dateOfBirth || '',
          heightFeet: heightFeet || profile.heightFeet || '',
          heightInches: heightInches || profile.heightInches || '',
        };
        
        // CRITICAL: Update state from the saved profile response
        // This ensures the form shows the saved data, not data from /me
        // 
        // IMPORTANT: We update BOTH profile and initialProfile to the SAME values
        // This ensures hasChanges stays false and the form shows as "saved"
        setProfile(updatedState);
        setInitialProfile(updatedState);
        
        // Log for debugging - verify state was updated correctly
        console.log('[Profile] Profile saved and state updated:', {
          name: updatedState.name,
          weight: updatedState.weight,
          height: `${updatedState.heightFeet}'${updatedState.heightInches}"`,
          location: updatedState.location,
          dateOfBirth: updatedState.dateOfBirth,
          gender: updatedState.gender,
          unitSystem: updatedState.unitSystem,
          rawResponse: updatedProfile, // Log full response for debugging
        });
      } else {
        // If no response, just update initial profile to current state
        // This marks the form as "saved" even if backend didn't return data
        setInitialProfile({ ...profile });
        console.warn('[Profile] Save succeeded but no response data, using current state');
      }
      
      setHasChanges(false);
      
      // CRITICAL: After save, the response should contain all saved values
      // But if it doesn't, we'll use what we just sent (which is in profile state)
      // The state update above already handles this with nullish coalescing
      
      // CRITICAL: Keep the guard active longer to prevent any refetch from clearing fields
      // Extended to 5 seconds to cover any background syncs or refetches
      setTimeout(() => {
        justSavedRef.current = false;
        console.log('[Profile] Save guard expired - profile can be reloaded again');
        // Reload profile from backend to ensure we have the latest data
        // This ensures that if the user stays on the page, they see the saved data
        loadProfile();
      }, 5000);
      
      // CRITICAL: Reset save guard after a delay to allow future saves
      // But keep it long enough to prevent immediate re-saves from state updates
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);
      
      // Invalidate queries to update unit system across the app
      // NOTE: This does NOT trigger a profile reload because we guard against it
      // NOTE: This does NOT trigger another save because we guard against it
      // NOTE: We use refetchType: 'none' to prevent automatic refetches
      await queryClient.invalidateQueries({ 
        queryKey: ['userProfile'],
        refetchType: 'none' // Don't automatically refetch - we handle it manually above
      });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully',
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
      
      // Reset save guard on error so user can retry
      isSavingRef.current = false;
      
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
              onChange={(e) => {
                const newName = e.target.value;
                console.log('[Profile] Name field changed:', { oldValue: profile.name, newValue: newName });
                setProfile({ ...profile, name: newName });
              }}
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
