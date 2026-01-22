import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

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
 * ConnectSuccess - Pure redirect page after OAuth callback.
 * 
 * This page should NEVER manage auth state. It only observes authStatus
 * and routes accordingly. OAuthTokenHandler already:
 * 1. Stores the token
 * 2. Calls refreshUser() which updates AuthContext
 * 3. Navigates here
 * 
 * This page simply:
 * - If authenticated → route to "/" (AuthLanding handles routing)
 * - If unauthenticated → route to "/login"
 * - While loading → show loader
 * 
 * No flags, no refresh logic, no waiting on side effects.
 */
export default function ConnectSuccess() {
  const navigate = useNavigate();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      console.log("[ConnectSuccess] User authenticated, redirecting to /");
      navigate("/", { replace: true });
    } else if (status === "unauthenticated") {
      console.log("[ConnectSuccess] User not authenticated, redirecting to /login");
      navigate("/login", { replace: true });
    }
    // If status === "bootstrapping", stay on this page and show loader
  }, [status, navigate]);

  // Show loader while auth is resolving
  return <FullPageSkeleton />;
}
