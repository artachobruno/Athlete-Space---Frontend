import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingChat, type AthleteOnboardingProfile } from '@/components/onboarding/OnboardingChat';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, status, refreshUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasRedirectedRef = useRef(false);

  // CRITICAL: Onboarding is ONLY for authenticated users with incomplete onboarding
  // If not authenticated, redirect to login (NOT a fallback for auth failures)
  // If onboarding already complete (backend is source of truth), redirect to dashboard
  useEffect(() => {
    // Block routing until auth resolves
    if (status === "bootstrapping" || loading) {
      return;
    }

    // CRITICAL: If unauthenticated, go to login (NOT onboarding)
    // Onboarding is a post-auth state, not an auth fallback
    if (status === "unauthenticated" || !user) {
      console.log("[Onboarding] User not authenticated, redirecting to login");
      navigate('/login', { replace: true });
      return;
    }

    // CRITICAL: Backend is source of truth for onboarding completion
    // If backend says onboarding is complete, redirect to dashboard
    if (status === "authenticated" && user && user.onboarding_complete && !hasRedirectedRef.current) {
      console.log("[Onboarding] Backend confirms onboarding complete, redirecting to dashboard");
      hasRedirectedRef.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, status, navigate]);

  const handleComplete = async (profile: AthleteOnboardingProfile): Promise<void> => {
    // CRITICAL: Frontend never decides onboarding completion
    // This callback is only called after backend confirms success via completeOnboarding()
    // Refresh user state from backend to get updated onboarding_complete value
    setIsSubmitting(true);
    
    try {
      console.log("[Onboarding] Onboarding completed, refreshing user state from backend", { profile });
      await refreshUser();
      
      // Reset redirect ref to allow useEffect to handle redirect
      hasRedirectedRef.current = false;
      
      // Small delay to allow React state to update after refreshUser
      // The useEffect will check user.onboarding_complete and redirect if true
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Note: After refreshUser completes, the user state should be updated
      // The useEffect hook depends on `user`, so when user updates, it will check
      // user.onboarding_complete and redirect if true
      console.log("[Onboarding] User state refreshed, waiting for useEffect to redirect based on backend state");
    } catch (error) {
      console.error("[Onboarding] Failed to refresh user state:", error);
      toast({
        title: 'Error',
        description: 'Failed to refresh user state. Please refresh the page to verify onboarding completion.',
        variant: 'destructive',
      });
      // Don't redirect on error - let user manually refresh or try again
      // Backend should have confirmed completion, but we couldn't verify it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100svh] bg-background flex flex-col">
      {/* Minimal header */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <span className="font-semibold text-foreground">AI Training Coach</span>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <OnboardingChat onComplete={handleComplete} isComplete={isSubmitting} />
      </main>
    </div>
  );
}
