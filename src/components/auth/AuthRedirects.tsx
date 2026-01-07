import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
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
 */
export function AuthLanding() {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return user.onboarding_complete
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/onboarding" replace />;
}

/**
 * Wrapper for public-only pages like /login and /signup.
 * Prevents showing auth forms to already-authenticated users.
 */
export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <FullPageSkeleton />;
  if (user) {
    return user.onboarding_complete
      ? <Navigate to="/dashboard" replace />
      : <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
