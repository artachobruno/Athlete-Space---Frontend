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
 * - Unauthenticated → /login
 * - Authenticated but onboarding incomplete → /onboarding
 * - Authenticated + onboarding complete → /dashboard
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

  // If OAuth token is being processed, show loading (OAuthTokenHandler will redirect)
  if (hasOAuthToken) {
    return <FullPageSkeleton />;
  }

  if (status === "loading" || loading) return <FullPageSkeleton />;
  if (status === "unauthenticated" || !user) return <Navigate to="/login" replace />;

  return user.onboarding_complete
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/onboarding" replace />;
}

/**
 * Wrapper for public-only pages like /login and /signup.
 * Prevents showing auth forms to already-authenticated users.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading, status } = useAuth();

  if (status === "loading" || loading) return <FullPageSkeleton />;
  if (status === "authenticated" && user) {
    return user.onboarding_complete
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
