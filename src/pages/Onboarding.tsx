import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';
import { getStoredProfile } from '@/lib/storage';
import { auth } from '@/lib/auth';

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isComplete, setIsComplete] = useState(false);

  // Check for auth token in URL params (from Strava OAuth callback)
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      auth.setToken(token);
      // Remove token from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('token');
      const newSearch = newSearchParams.toString();
      navigate(`/onboarding${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const profile = getStoredProfile();
    // Only redirect if profile is complete AND user is authenticated
    if (profile?.onboardingComplete && auth.isLoggedIn()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleComplete = () => {
    setIsComplete(true);
    setTimeout(() => {
      navigate('/dashboard');
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
