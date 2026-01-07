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
    const error = searchParams.get('error');
    
    // Check for OAuth errors first
    if (error) {
      console.error('[Onboarding] OAuth error:', error);
      // Error is already in URL, user will see it or we can show a toast
      // Remove error from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      const newSearch = newSearchParams.toString();
      navigate(`/onboarding${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      return;
    }
    
    if (token) {
      console.log('[Onboarding] Token found in URL, storing...', {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 30) + '...',
      });
      auth.setToken(token);
      
      // Verify token was stored
      const storedToken = auth.getToken();
      if (storedToken) {
        console.log('[Onboarding] ✅ Token stored successfully');
      } else {
        console.error('[Onboarding] ❌ Failed to store token!');
      }
      
      // Remove token from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('token');
      const newSearch = newSearchParams.toString();
      navigate(`/onboarding${newSearch ? `?${newSearch}` : ''}`, { replace: true });
    } else {
      // Check if token exists in localStorage (for returning users)
      const existingToken = auth.getToken();
      if (existingToken) {
        console.log('[Onboarding] Existing token found in localStorage');
      } else {
        console.log('[Onboarding] No token in URL or localStorage - user needs to authenticate');
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const profile = getStoredProfile();
    const isAuthenticated = auth.isLoggedIn();
    
    // If user has a token, validate it by checking profile
    if (isAuthenticated && profile?.onboardingComplete) {
      // User is authenticated and has completed onboarding - redirect to dashboard
      navigate('/dashboard', { replace: true });
    } else if (isAuthenticated && !profile?.onboardingComplete) {
      // User has token but hasn't completed onboarding - stay on onboarding
      // This handles returning users who need to finish onboarding
    } else if (!isAuthenticated && profile?.onboardingComplete) {
      // User completed onboarding but lost token - they need to reconnect
      // Stay on onboarding so they can reconnect Strava
    }
    // If no token and no profile, user is new - stay on onboarding
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
