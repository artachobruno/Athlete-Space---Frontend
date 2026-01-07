import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSyncActivities } from "@/hooks/useSyncActivities";
import { auth } from "@/lib/auth";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import TrainingPlan from "./pages/TrainingPlan";
import Activities from "./pages/Activities";
import Analytics from "./pages/Analytics";
import Coach from "./pages/Coach";
import Settings from "./pages/Settings";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on CORS/network errors, timeouts, or auth errors
        if (error && typeof error === 'object') {
          const apiError = error as { code?: string; message?: string; status?: number };
          // Don't retry on network errors, CORS errors, timeouts, or 401 (auth) errors
          if (apiError.status === 401 || 
              apiError.code === 'ERR_NETWORK' || 
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
            // The API interceptor will handle redirect, but we should also clear any cached data
            auth.clear();
            // Redirect will be handled by the API interceptor
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

// Component to handle sync on app mount
const AppContent = () => {
  // Automatically check for recent activities on app mount/page refresh
  useSyncActivities();
  
  return (
    <BrowserRouter>
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
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
