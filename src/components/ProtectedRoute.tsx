import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/auth';
import { getStoredProfile } from '@/lib/storage';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean; // If false, allows access after onboarding even without auth
}

/**
 * ProtectedRoute component that redirects to onboarding if user is not authenticated.
 * This prevents users from accessing protected routes without a valid auth token.
 * 
 * If requireAuth is false, allows access after onboarding completion even without full auth.
 */
export function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = auth.isLoggedIn();

  useEffect(() => {
    // If not authenticated and not already on onboarding, redirect
    if (!isAuthenticated && location.pathname !== '/onboarding') {
      // Clear any stale token
      auth.clear();
    }
  }, [isAuthenticated, location.pathname]);

  // If auth is required, check for token
  if (requireAuth && !isAuthenticated) {
    // Redirect to onboarding, preserving the attempted route for after login
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  // If auth is not required, check if onboarding is complete
  if (!requireAuth && !isAuthenticated) {
    const profile = getStoredProfile();
    if (!profile?.onboardingComplete) {
      // Onboarding not complete, redirect to onboarding
      return <Navigate to="/onboarding" replace state={{ from: location }} />;
    }
    // Onboarding complete but no auth - allow access (user can connect Strava later)
  }

  return <>{children}</>;
}

