import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import axios from 'axios';
import { getBaseURL } from '@/lib/api';

/**
 * Types for athlete profile API
 */
export interface AthleteProfile {
  identity: {
    first_name?: string;
    last_name?: string;
    age?: number;
    gender?: string;
    location?: string;
    timezone?: string;
  };
  goals: {
    primary_goal?: string;
    goal_type?: string;
    target_event?: string;
    target_date?: string;
    performance_targets?: string[];
    completion_targets?: string[];
  };
  constraints: {
    availability_days_per_week?: number;
    availability_hours_per_week?: number;
    injury_status?: string;
    injury_notes?: string;
    restrictions?: string[];
    equipment_limitations?: string[];
  };
  training_context: {
    primary_sport?: string;
    experience_level?: string;
    years_training?: number;
    current_phase?: string;
    recent_performance?: string;
    training_history_summary?: string;
  };
  preferences: {
    recovery_preference?: string;
    coaching_style?: string;
    plan_flexibility?: string;
    feedback_frequency?: string;
    preferred_training_times?: string[];
    preferred_workout_types?: string[];
    disliked_workout_types?: string[];
  };
  narrative_bio?: {
    text: string;
    confidence_score: number;
    source: string;
    depends_on_hash?: string;
  };
}

export interface ProfileUpdateRequest {
  identity?: Partial<AthleteProfile['identity']>;
  goals?: Partial<AthleteProfile['goals']>;
  constraints?: Partial<AthleteProfile['constraints']>;
  training_context?: Partial<AthleteProfile['training_context']>;
  preferences?: Partial<AthleteProfile['preferences']>;
}

export interface BioRegenerateResponse {
  success: boolean;
  bio_text: string;
  confidence_score: number;
  source: string;
}

export interface BioConfirmRequest {
  bio_text?: string;
}

/**
 * Fetch athlete profile
 */
async function fetchProfile(): Promise<AthleteProfile> {
  const baseURL = getBaseURL();
  const response = await axios.get<AthleteProfile>(`${baseURL}/profile`, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * Update athlete profile (partial update)
 */
async function updateProfile(update: ProfileUpdateRequest): Promise<AthleteProfile> {
  const baseURL = getBaseURL();
  const response = await axios.patch<AthleteProfile>(`${baseURL}/profile`, update, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * Regenerate athlete bio
 */
async function regenerateBio(): Promise<BioRegenerateResponse> {
  const baseURL = getBaseURL();
  const response = await axios.post<BioRegenerateResponse>(`${baseURL}/profile/bio/regenerate`, {}, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * Confirm/accept athlete bio
 */
async function confirmBio(request: BioConfirmRequest): Promise<BioRegenerateResponse> {
  const baseURL = getBaseURL();
  const response = await axios.post<BioRegenerateResponse>(`${baseURL}/profile/bio/confirm`, request, {
    withCredentials: true,
  });
  return response.data;
}

/**
 * Hook to fetch and manage athlete profile.
 * 
 * Provides:
 * - Profile data with loading/error states
 * - Update profile mutation
 * - Regenerate bio mutation
 * - Confirm bio mutation
 * - Stale bio detection
 */
export function useAthleteProfile() {
  const queryClient = useQueryClient();

  // Fetch profile
  const profileQuery = useAuthenticatedQuery<AthleteProfile>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile doesn't change frequently
    gcTime: 30 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      // Invalidate and refetch profile
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Regenerate bio mutation
  const regenerateBioMutation = useMutation({
    mutationFn: regenerateBio,
    onSuccess: () => {
      // Invalidate profile to refetch with new bio
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Confirm bio mutation
  const confirmBioMutation = useMutation({
    mutationFn: confirmBio,
    onSuccess: () => {
      // Invalidate profile to refetch with confirmed bio
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  // Check if bio is stale
  const isBioStale = profileQuery.data?.narrative_bio?.source !== 'ai_generated' &&
                     profileQuery.data?.narrative_bio?.source !== 'user_edited';

  // Check if bio needs review (low confidence or stale)
  const needsBioReview = 
    !profileQuery.data?.narrative_bio ||
    (profileQuery.data.narrative_bio.confidence_score < 0.7 && profileQuery.data.narrative_bio.source === 'ai_generated') ||
    isBioStale;

  return {
    // Profile data
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,

    // Bio status
    hasBio: !!profileQuery.data?.narrative_bio,
    bioText: profileQuery.data?.narrative_bio?.text,
    bioConfidence: profileQuery.data?.narrative_bio?.confidence_score,
    bioSource: profileQuery.data?.narrative_bio?.source,
    isBioStale,
    needsBioReview,

    // Mutations
    updateProfile: updateProfileMutation.mutate,
    updateProfileAsync: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,

    regenerateBio: regenerateBioMutation.mutate,
    regenerateBioAsync: regenerateBioMutation.mutateAsync,
    isRegeneratingBio: regenerateBioMutation.isPending,
    regenerateBioError: regenerateBioMutation.error,

    confirmBio: confirmBioMutation.mutate,
    confirmBioAsync: confirmBioMutation.mutateAsync,
    isConfirmingBio: confirmBioMutation.isPending,
    confirmBioError: confirmBioMutation.error,

    // Refresh profile
    refetch: profileQuery.refetch,
  };
}
