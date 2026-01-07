import { useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { auth } from "@/lib/auth";

const NotFound = () => {
  const location = useLocation();
  const isAuthenticated = auth.isLoggedIn();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // If user is not authenticated, redirect to onboarding instead of showing 404
  if (!isAuthenticated) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
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
