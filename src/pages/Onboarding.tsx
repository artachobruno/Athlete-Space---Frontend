import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';
import { useAuth } from '@/context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isComplete, setIsComplete] = useState(false);
  const hasRedirectedRef = useRef(false);

  // Redirect if user has completed onboarding (only once)
  // Credentials are always required and checked by AuthContext
  useEffect(() => {
    // Guard: only redirect once, and only if not already completing
    if (!loading && user?.onboarding_complete && !isComplete && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate, isComplete]);

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
