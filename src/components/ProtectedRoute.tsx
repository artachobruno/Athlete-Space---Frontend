import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that redirects to onboarding if user is not authenticated.
 * This prevents users from accessing protected routes without a valid auth token.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = auth.isLoggedIn();

  useEffect(() => {
    // If not authenticated and not already on onboarding, redirect
    if (!isAuthenticated && location.pathname !== '/onboarding') {
      // Clear any stale token
      auth.clear();
    }
  }, [isAuthenticated, location.pathname]);

  if (!isAuthenticated) {
    // Redirect to onboarding, preserving the attempted route for after login
    return <Navigate to="/onboarding" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

