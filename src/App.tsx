import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
        // Don't retry on CORS/network errors
        if (error && typeof error === 'object' && 'code' in error) {
          const apiError = error as { code?: string; message?: string };
          if (apiError.code === 'ERR_NETWORK' || 
              (apiError.message && apiError.message.includes('CORS'))) {
            return false;
          }
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      staleTime: 30000, // 30 seconds
      onError: (error) => {
        // Silently handle CORS/network errors - they're expected when backend is misconfigured
        if (error && typeof error === 'object' && 'code' in error) {
          const apiError = error as { code?: string; message?: string };
          if (apiError.code === 'ERR_NETWORK' || 
              (apiError.message && apiError.message.includes('CORS'))) {
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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/plan" element={<TrainingPlan />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/coach" element={<Coach />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
