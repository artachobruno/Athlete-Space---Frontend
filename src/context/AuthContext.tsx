import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCurrentUser, logout as logoutApi, type AuthUser } from "@/lib/auth";

export type AuthStatus = "bootstrapping" | "unauthenticated" | "authenticated";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  status: AuthStatus;
  authReady: boolean; // True when auth check is complete (loading === false)
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  status: "bootstrapping",
  authReady: false,
  refreshUser: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<AuthStatus>("bootstrapping");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent multiple simultaneous calls
    if (isRefreshing) {
      return;
    }
    
    setIsRefreshing(true);
    setLoading(true);
    // Don't set status to "loading" here - preserve bootstrapping if this is initial load
    
    try {
      // Call /me to validate authentication (HTTP-only cookie handles auth)
      // This is the ONLY way to set status to "authenticated"
      const currentUser = await fetchCurrentUser();
      
      // CRITICAL: Only set "authenticated" if /me succeeded
      // If /me returns null, it means cookie is missing/invalid
      if (!currentUser) {
        // /me failed = unauthenticated (cookie missing/invalid)
        console.log("[AuthContext] /me returned null, setting unauthenticated");
        setUser(null);
        setStatus("unauthenticated");
      } else {
        // /me succeeded = authenticated
        // CRITICAL: Backend is source of truth for onboarding_complete
        setUser(currentUser);
        setStatus("authenticated");
      }
    } catch (error) {
      console.error("[AuthContext] Unexpected error:", error);
      // Any error = unauthenticated (don't assume authenticated)
      setUser(null);
      setStatus("unauthenticated");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      console.error("[AuthContext] Logout error:", error);
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      setLoading(false);
    }
  };

  // Listen for logout events from API interceptor (401 responses)
  useEffect(() => {
    const handleLogoutEvent = () => {
      console.log("[AuthContext] Received logout event from API interceptor");
      // CRITICAL: 401 = unauthenticated, NOT onboarding
      // Clear user and set status to unauthenticated
      setUser(null);
      setStatus("unauthenticated");
      setLoading(false);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth-logout', handleLogoutEvent);
    };
  }, []);

  // On app boot, hydrate auth BEFORE deciding status
  // CRITICAL: This must run once and block rendering until complete
  // CRITICAL: Never set status to "unauthenticated" before /me completes
  // This prevents redirect loops on refresh/deep-link
  useEffect(() => {
    const bootstrapAuth = async () => {
      console.log("[AuthContext] Bootstrapping auth...");
      
      // Ensure we start in bootstrapping state (defensive)
      setStatus("bootstrapping");
      setLoading(true);
      
      // For mobile: Check if token exists in secure storage
      // For web: Call /me to check authentication (HTTP-only cookie handles auth)
      const { isNative } = await import('@/lib/platform');
      if (isNative()) {
        const { hasValidToken } = await import('@/lib/tokenStorage');
        const hasToken = await hasValidToken();
        
        if (!hasToken) {
          console.log("[AuthContext] No valid token found for mobile, setting unauthenticated");
          setUser(null);
          setStatus("unauthenticated");
          setLoading(false);
          return;
        }
        console.log("[AuthContext] Valid token found for mobile, checking /me");
      }
      
      // Call /me to check authentication
      // Web: HTTP-only cookie handles auth
      // Mobile: Bearer token in Authorization header (set by API interceptor)
      try {
        const currentUser = await fetchCurrentUser();
        
        if (!currentUser) {
          console.log("[AuthContext] /me returned null, setting unauthenticated");
          setUser(null);
          setStatus("unauthenticated");
        } else {
          console.log("[AuthContext] /me succeeded, setting authenticated");
          setUser(currentUser);
          setStatus("authenticated");
        }
      } catch (error) {
        console.error("[AuthContext] Bootstrap error:", error);
        // Any error = unauthenticated (don't assume authenticated)
        setUser(null);
        setStatus("unauthenticated");
      } finally {
        // CRITICAL: Only set loading to false AFTER status is determined
        // This ensures guards never redirect during bootstrap
        setLoading(false);
      }
    };
    
    bootstrapAuth();
  }, []);

  // authReady = auth check is complete (not bootstrapping)
  const authReady = !loading && status !== "bootstrapping";

  return (
    <AuthContext.Provider value={{ user, loading, status, authReady, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
