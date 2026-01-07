import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSyncActivities } from "@/hooks/useSyncActivities";
import { useValidateAuth } from "@/hooks/useValidateAuth";
import { useAuthState } from "@/hooks/useAuthState";
import { auth } from "@/lib/auth";
import { useEffect, createContext, useContext } from "react";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import TrainingPlan from "./pages/TrainingPlan";
import Activities from "./pages/Activities";
import Analytics from "./pages/Analytics";
import Coach from "./pages/Coach";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

// Auth context to provide auth state to all components
const AuthContext = createContext<{ isLoaded: boolean; isAuthenticated: boolean; token: string | null }>({
  isLoaded: false,
  isAuthenticated: false,
  token: null,
});

// Hook to access auth state
export const useAuth = () => useContext(AuthContext);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // CRITICAL: Disable queries by default - they will be enabled when auth is ready
      // This prevents race conditions where queries fire before auth is initialized
      enabled: false, // Will be overridden by individual queries based on auth state
      
      retry: (failureCount, error) => {
        // Don't retry on CORS/network errors, timeouts, or auth errors
        if (error && typeof error === 'object') {
          const apiError = error as { code?: string; message?: string; status?: number };
          // CRITICAL: Never retry on 401 - auth is not ready or token is invalid
          if (apiError.status === 401) {
            return false; // Stop retrying immediately on 401
          }
          // Don't retry on network errors, CORS errors, or timeouts
          if (apiError.code === 'ERR_NETWORK' || 
              apiError.code === 'ECONNABORTED' ||
              (apiError.message && (
                apiError.message.includes('CORS') ||
                apiError.message.includes('timeout') ||
                apiError.message.includes('timed out') ||
                apiError.message.includes('Authentication required')
              ))) {
            return false;
          }
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      // Optimized default cache times
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 min (formerly cacheTime)
      // Query deduplication: if same query is called multiple times within 2s, only fetch once
      structuralSharing: true,
      onError: (error) => {
        // Handle 401 authentication errors globally
        if (error && typeof error === 'object' && 'status' in error) {
          const apiError = error as { status?: number; code?: string; message?: string };
          if (apiError.status === 401) {
            // Auth error - token is invalid or missing
            // Check if we're on a page that allows unauthenticated access
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
            const unauthenticatedAllowedPaths = ["/dashboard", "/onboarding"];
            const allowsUnauthenticated = unauthenticatedAllowedPaths.some(path => 
              currentPath === path || currentPath.startsWith(`${path}/`)
            );
            
            // Only clear auth and redirect if we're on a page that requires auth
            // Pages that allow unauthenticated access should handle 401s gracefully
            if (!allowsUnauthenticated) {
              auth.clear();
              // Redirect will be handled by the API interceptor
            }
            // Silently handle 401s on pages that allow unauthenticated access
            return;
          }
        }
        // Silently handle CORS/network errors and timeouts - they're expected when backend is slow or misconfigured
        if (error && typeof error === 'object' && 'code' in error) {
          const apiError = error as { code?: string; message?: string };
          if (apiError.code === 'ERR_NETWORK' || 
              apiError.code === 'ECONNABORTED' ||
              (apiError.message && (
                apiError.message.includes('CORS') ||
                apiError.message.includes('timeout') ||
                apiError.message.includes('timed out')
              ))) {
            return; // Don't log these errors
          }
        }
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Component to handle auth redirect events from API interceptor
const AuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthRedirect = (event: Event) => {
      const customEvent = event as CustomEvent<{ path: string }>;
      const path = customEvent.detail?.path;
      if (path && window.location.pathname !== path) {
        navigate(path, { replace: true });
      }
    };

    window.addEventListener('auth-redirect', handleAuthRedirect);
    return () => {
      window.removeEventListener('auth-redirect', handleAuthRedirect);
    };
  }, [navigate]);

  return null;
};

// Component to validate auth on app load (inside router for navigation)
const AuthValidator = () => {
  useValidateAuth();
  return null;
};

// Component to provide auth state to all components
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const authState = useAuthState();
  
  return (
    <AuthContext.Provider value={authState}>
      {children}
    </AuthContext.Provider>
  );
};

// Component to handle sync on app mount and auth redirects
const AppContent = () => {
  // Only sync activities when auth is ready and user is authenticated
  // This prevents race conditions
  useSyncActivities();
  
  return (
    <BrowserRouter>
      <AuthValidator />
      <AuthRedirectHandler />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requireAuth={false}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plan"
          element={
            <ProtectedRoute>
              <TrainingPlan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <Activities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach"
          element={
            <ProtectedRoute>
              <Coach />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
