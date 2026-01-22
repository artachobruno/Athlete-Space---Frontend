import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { user, status, loading } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // CRITICAL: Do NOT redirect while bootstrapping or loading
  // This prevents redirect loops on refresh/deep-link
  if (status === "bootstrapping" || loading) {
    return null; // Or show loading spinner
  }

  // If user is not authenticated, redirect to login
  // Only check status, not user - status is the source of truth
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but onboarding incomplete, redirect to onboarding
  if (status === "authenticated" && user && !user.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding complete, show 404 (user can navigate back to dashboard)

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/dashboard" className="text-primary underline hover:text-primary/90">
          Return to Dashboard
        </a>
      </div>
    </div>
  );
};

export default NotFound;
