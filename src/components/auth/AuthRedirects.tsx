import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { isPreviewMode } from "@/lib/preview";
import Landing from "@/pages/Landing";

function FullPageSkeleton() {
  return (
    <div className="min-h-[100svh] flex items-center justify-center">
      <div className="space-y-4 w-full max-w-md p-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    </div>
  );
}

/**
 * Root route handler ("/").
 * - Loading → show loading (block routing until auth resolves)
 * - Unauthenticated → show Landing page
 * - Authenticated but onboarding incomplete → /onboarding
 * - Authenticated + onboarding complete → /dashboard
 * 
 * CRITICAL RULES:
 * 1. Never show onboarding when status !== "authenticated"
 * 2. Never show onboarding when user === null
 * 3. Onboarding is ONLY shown when: status === "authenticated" && user.onboarding_complete === false
 * 4. Block all routing until auth resolves (status !== "loading")
 * 
 * NOTE: Backend should set HTTP-only cookies during OAuth callback.
 * AuthContext automatically checks authentication via /me endpoint.
 */
export function AuthLanding() {
  const { user, loading, status } = useAuth();

  // Preview mode bypass - redirect directly to dashboard (no auth needed)
  if (isPreviewMode()) {
    console.log("[AuthLanding] Preview mode detected, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  // CRITICAL: Hard gate - block all routing until auth status is resolved
  // This prevents redirect loops on refresh/deep-link
  if (status === "bootstrapping" || loading) {
    return <FullPageSkeleton />;
  }

  // CRITICAL: Unauthenticated → show Landing page (NOT redirect to login)
  // Users can navigate to /login or /signup from the landing page
  // Only check status, not user - status is the source of truth
  // Checking !user can cause race conditions during hydration
  if (status === "unauthenticated") {
    return <Landing />;
  }

  // CRITICAL: Only show onboarding when authenticated AND onboarding incomplete
  // Onboarding is a post-auth state, not an auth fallback
  if (status === "authenticated" && user && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // Authenticated + onboarding complete → dashboard
  return <Navigate to="/dashboard" replace />;
}

/**
 * Wrapper for public-only pages like /login and /signup.
 * Prevents showing auth forms to already-authenticated users.
 * 
 * CRITICAL: Only redirect to onboarding when authenticated AND onboarding incomplete
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading, status } = useAuth();

  // CRITICAL: Block routing until auth resolves
  if (status === "bootstrapping" || loading) {
    return <FullPageSkeleton />;
  }

  // CRITICAL: Only redirect to onboarding when authenticated AND onboarding incomplete
  // Onboarding is a post-auth state, not an auth fallback
  if (status === "authenticated" && user) {
    if (!user.onboarding_complete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
