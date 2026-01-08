import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that redirects to login if user is not authenticated.
 * This enforces that all protected routes require valid credentials.
 * 
 * Since credentials are mandatory, there is no path that allows access without auth.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuthenticated = auth.isLoggedIn();

  useEffect(() => {
    // If not authenticated, clear any stale token
    if (!isAuthenticated) {
      auth.clear();
    }
  }, [isAuthenticated]);

  // Always require authentication - credentials are mandatory
  if (!isAuthenticated) {
    // Redirect to login, preserving the attempted route for after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

