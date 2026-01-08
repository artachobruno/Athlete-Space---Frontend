import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';
import { useAuth } from '@/context/AuthContext';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isComplete, setIsComplete] = useState(false);

  // Redirect if user has completed onboarding
  // Credentials are always required and checked by AuthContext
  useEffect(() => {
    if (!loading && user?.onboarding_complete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

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
