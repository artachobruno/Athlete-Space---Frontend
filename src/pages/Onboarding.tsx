import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';
import { useAuth } from '@/context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, status } = useAuth();
  const [isComplete, setIsComplete] = useState(false);
  const hasRedirectedRef = useRef(false);

  // CRITICAL: Onboarding is ONLY for authenticated users with incomplete onboarding
  // If not authenticated, redirect to login (NOT a fallback for auth failures)
  // If onboarding already complete, redirect to dashboard
  useEffect(() => {
    // Block routing until auth resolves
    if (status === "loading" || loading) {
      return;
    }

    // CRITICAL: If unauthenticated, go to login (NOT onboarding)
    // Onboarding is a post-auth state, not an auth fallback
    if (status === "unauthenticated" || !user) {
      console.log("[Onboarding] User not authenticated, redirecting to login");
      navigate('/login', { replace: true });
      return;
    }

    // CRITICAL: Only show onboarding when authenticated AND onboarding incomplete
    // If onboarding is already complete, redirect to dashboard
    if (status === "authenticated" && user && user.onboarding_complete && !isComplete && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, status, navigate, isComplete]);

  const handleComplete = () => {
    setIsComplete(true);
    hasRedirectedRef.current = true; // Prevent useEffect from also redirecting
    setTimeout(() => {
      navigate('/dashboard', { replace: true });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal header */}
      <header className="h-14 border-b border-border flex items-center px-6">
        <span className="font-semibold text-foreground">AI Training Coach</span>
      </header>

      {/* Chat area */}
      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <OnboardingChat onComplete={handleComplete} isComplete={isComplete} />
      </main>
    </div>
  );
}
