import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AuthLanding, PublicOnly } from "@/components/auth/AuthRedirects";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useSyncActivities } from "@/hooks/useSyncActivities";
import { useValidateAuth } from "@/hooks/useValidateAuth";
import { auth } from "@/lib/auth";
import { useEffect } from "react";
import { ThemeProvider } from "@/hooks/useTheme";
import { safeDetectStore, safeInitAnalytics } from "@/lib/safe-analytics";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import TrainingPlan from "./pages/TrainingPlan";
import Activities from "./pages/Activities";
import Analytics from "./pages/Analytics";
import Coach from "./pages/Coach";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Privacy from "./pages/Privacy";
import FAQ from "./pages/FAQ";
import ScienceAndAI from "./pages/ScienceAndAI";
import About from "./pages/About";
import Terms from "./pages/Terms";
import ConnectSuccess from "./pages/ConnectSuccess";
import NotFound from "./pages/NotFound";

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
// NOTE: AuthContext already handles auth validation via /me endpoint
// This component is kept for backward compatibility but does nothing
// AuthContext.refreshUser() is called on mount and handles all auth state
const AuthValidator = () => {
  // AuthContext already handles auth validation - no need to duplicate
  // useValidateAuth() is redundant and can cause race conditions
  return null;
};

// Component to handle OAuth token from URL (works on any route)
const OAuthTokenHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser, user } = useAuth();
  
  useEffect(() => {
    // Check for token in URL params (from Strava OAuth callback)
    // This can happen on any route, not just /onboarding
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    
    if (error) {
      console.error('[OAuth] Error in URL:', error);
      // Remove error from URL and redirect appropriately
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('error');
      const newSearch = newSearchParams.toString();
      
      // If onboarding already complete, go to dashboard; otherwise onboarding
      if (user?.onboarding_complete) {
        navigate(`/dashboard${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      } else {
        navigate(`/onboarding${newSearch ? `?${newSearch}` : ''}`, { replace: true });
      }
      return;
    }
    
    if (token) {
      console.log('[OAuth] Token found in URL on route:', location.pathname, {
        tokenLength: token.length,
        tokenPreview: token.substring(0, 30) + '...',
      });
      
      // Store the token
      auth.setToken(token);
      
      // Verify token was stored
      const storedToken = auth.getToken();
      if (storedToken) {
        console.log('[OAuth] ✅ Token stored successfully');
        // Refresh user state from backend, then send to success page
        refreshUser()
          .then(() => {
            navigate('/connect-success', { replace: true });
          })
          .catch((err) => {
            console.error('[OAuth] Failed to refresh user after token storage:', err);
            // Still navigate to success page – it will handle missing user
            navigate('/connect-success', { replace: true });
          });
      } else {
        console.error('[OAuth] ❌ Failed to store token!');
      }
    }
  }, [location, navigate, refreshUser, user]);
  
  return null;
};

// Component to safely initialize third-party libraries (analytics, browser extensions)
// ONLY runs when user is authenticated to prevent crashes
const SafeThirdPartyInit = () => {
  const { status } = useAuth();

  useEffect(() => {
    // CRITICAL: Only initialize when authenticated
    // This prevents detectStore().then() crashes when logged out
    if (status !== "authenticated") {
      return;
    }

    // Safely handle detectStore (from browser extensions or third-party libraries)
    // detectStore might be undefined or might not return a Promise
    // safeDetectStore handles both cases
    const detectStoreFn = (window as { detectStore?: () => unknown | Promise<unknown> }).detectStore;
    safeDetectStore(detectStoreFn)
      .then(() => {
        // Only initialize analytics after detectStore completes (if it exists)
        // If detectStore was undefined, this still runs immediately
        const analyticsInit = (window as { analytics?: { init?: () => void | Promise<void> } }).analytics?.init;
        safeInitAnalytics(status, analyticsInit);
      })
      .catch(() => {
        // Already handled by safeDetectStore, but catch just in case
      });
  }, [status]);

  return null;
};

// Component to handle sync on app mount and auth redirects
const AppContent = () => {
  // Only sync activities when auth is ready and user is authenticated
  // This prevents race conditions
  useSyncActivities();
  
  return (
    <BrowserRouter>
      <OAuthTokenHandler />
      <AuthValidator />
      <AuthRedirectHandler />
      <SafeThirdPartyInit />
      <Routes>
        <Route path="/" element={<AuthLanding />} />
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/connect-success" element={<ConnectSuccess />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/science" element={<ScienceAndAI />} />
        <Route path="/about" element={<About />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/calendar"
          element={
            <RequireAuth>
              <Calendar />
            </RequireAuth>
          }
        />
        <Route
          path="/plan"
          element={
            <RequireAuth>
              <TrainingPlan />
            </RequireAuth>
          }
        />
        <Route
          path="/activities"
          element={
            <RequireAuth>
              <Activities />
            </RequireAuth>
          }
        />
        <Route
          path="/analytics"
          element={
            <RequireAuth>
              <Analytics />
            </RequireAuth>
          }
        />
        <Route
          path="/coach"
          element={
            <RequireAuth>
              <Coach />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
