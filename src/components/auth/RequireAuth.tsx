import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { isPreviewMode } from '@/lib/preview';
import { PreviewShell } from '@/components/preview/PreviewShell';

interface RequireAuthProps {
  children: ReactNode;
}

/**
 * RequireAuth component that protects routes requiring authentication.
 * Uses AuthContext (backend-driven) instead of localStorage checks.
 * 
 * - Shows loading skeleton while checking auth state
 * - Redirects to /login if user is not authenticated
 * - Redirects to /onboarding if onboarding is not complete
 * - Renders children if user is authenticated and onboarding is complete
 * 
 * PREVIEW MODE BYPASS:
 * - In Lovable preview mode, bypasses auth to allow visual previews
 * - This does NOT affect production security
 * - Only works when hostname includes "lovable" or VITE_PREVIEW_MODE=true
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading, status } = useAuth();

  // Preview mode bypass - ONLY works in Lovable preview
  // This does NOT affect production or real auth
  if (isPreviewMode()) {
    console.log("[RequireAuth] Preview mode detected, bypassing auth for visual preview");
    return <PreviewShell>{children}</PreviewShell>;
  }

  console.log("[RequireAuth] Auth state:", { user, loading, status, hasUser: !!user, onboardingComplete: user?.onboarding_complete });

  // CRITICAL: Do NOT redirect while bootstrapping
  // Show loading spinner until auth hydration completes
  if (status === "bootstrapping" || loading) {
    console.log("[RequireAuth] Bootstrapping, showing spinner");
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

  // Only redirect after bootstrapping completes
  if (status === "unauthenticated" || !user) {
    console.log("[RequireAuth] User not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // CRITICAL: Backend is source of truth for onboarding completion
  // If onboarding is not complete, redirect to onboarding
  if (status === "authenticated" && user && !user.onboarding_complete) {
    console.log("[RequireAuth] User authenticated but onboarding not complete, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }

  // User is authenticated and onboarding is complete
  console.log("[RequireAuth] User authenticated and onboarding complete, rendering children");
  return <>{children}</>;
}
