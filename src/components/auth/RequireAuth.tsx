import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * RequireAuth component that protects routes requiring authentication.
 * Uses AuthContext (backend-driven) instead of localStorage checks.
 * 
 * - Shows loading skeleton while checking auth state
 * - Redirects to /login if user is not authenticated
 * - Renders children if user is authenticated
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();

  console.log("[RequireAuth] Auth state:", { user, loading, hasUser: !!user });

  // Always show loading state while auth is being determined
  // This prevents redirects during initial load or errors
  if (loading) {
    console.log("[RequireAuth] Still loading, showing skeleton");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-8 w-3/4" />
        </div>
      </div>
    );
  }

  // Only redirect if loading is complete AND user is definitively null
  // This ensures we don't redirect on transient errors or render issues
  if (!user) {
    console.warn("[RequireAuth] No user found after loading complete, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  console.log("[RequireAuth] User authenticated, rendering children");
  return <>{children}</>;
}
