import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component that redirects to login if user is not authenticated.
 * This enforces that all protected routes require valid credentials.
 * 
 * Authentication is handled by HTTP-only cookies, checked via AuthContext.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { status, authReady } = useAuth();
  const isAuthenticated = authReady && status === "authenticated";

  // Wait for auth to be ready before making routing decisions
  if (!authReady) {
    // Still loading auth state - could show loading spinner here
    return null;
  }

  // Always require authentication - credentials are mandatory
  if (!isAuthenticated) {
    // Redirect to login, preserving the attempted route for after login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

