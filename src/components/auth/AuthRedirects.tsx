import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

function FullPageSkeleton() {
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

/**
 * Root route handler ("/").
 * - Loading → show loading (block routing until auth resolves)
 * - Unauthenticated → /login
 * - Authenticated but onboarding incomplete → /onboarding
 * - Authenticated + onboarding complete → /dashboard
 * 
 * CRITICAL RULES:
 * 1. Never show onboarding when status !== "authenticated"
 * 2. Never show onboarding when user === null
 * 3. Onboarding is ONLY shown when: status === "authenticated" && user.onboarding_complete === false
 * 4. Block all routing until auth resolves (status !== "loading")
 * 
 * CRITICAL: If OAuth token is in URL, wait for OAuthTokenHandler to process it
 * before redirecting. This prevents race conditions where we redirect before
 * the token is stored and user state is refreshed.
 */
export function AuthLanding() {
  const { user, loading, status } = useAuth();
  const location = useLocation();
  const [hasOAuthToken, setHasOAuthToken] = useState(false);

  // Check if there's an OAuth token in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    if (token) {
      console.log("[AuthLanding] OAuth token detected in URL, waiting for OAuthTokenHandler to process");
      setHasOAuthToken(true);
      // Give OAuthTokenHandler time to process (it will redirect to /connect-success)
      // After a short delay, if we're still here, proceed with normal redirect
      const timer = setTimeout(() => {
        setHasOAuthToken(false);
      }, 2000); // 2 seconds should be enough for OAuthTokenHandler to redirect
      return () => clearTimeout(timer);
    } else {
      setHasOAuthToken(false);
    }
  }, [location.search]);

  // CRITICAL: Block routing until auth resolves
  // If OAuth token is being processed, show loading (OAuthTokenHandler will redirect)
  if (hasOAuthToken) {
    return <FullPageSkeleton />;
  }

  // CRITICAL: Hard gate - block all routing until auth status is resolved
  if (status === "loading" || loading) {
    return <FullPageSkeleton />;
  }

  // CRITICAL: Unauthenticated → login (NOT onboarding)
  // 401, no token, or /me failed = unauthenticated → login
  if (status === "unauthenticated" || !user) {
    return <Navigate to="/login" replace />;
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
  if (status === "loading" || loading) {
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
