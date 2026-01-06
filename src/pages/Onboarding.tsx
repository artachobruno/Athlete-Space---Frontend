import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';
import { getStoredProfile } from '@/lib/storage';

export default function Onboarding() {
  const navigate = useNavigate();
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const profile = getStoredProfile();
    if (profile?.onboardingComplete) {
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
