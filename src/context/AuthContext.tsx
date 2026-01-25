import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCurrentUser, logout as logoutApi, type AuthUser } from "@/lib/auth";

export type AuthStatus = "bootstrapping" | "unauthenticated" | "authenticated";

/**
 * AuthContext provides authentication state from the /me endpoint.
 * 
 * ⚠️ CRITICAL ARCHITECTURAL INVARIANT:
 * 
 * AuthContext MUST NOT hydrate or overwrite athlete profile data.
 * 
 * - /me returns identity only (id, email, role, timezone, onboarding_complete, strava_connected)
 * - Profile data (name, weight, height, gender, location, etc.) lives exclusively in /me/profile
 * 
 * These are SEPARATE concerns:
 * - Identity/Auth = /me → AuthContext
 * - Athlete Profile = /me/profile → Profile components
 * 
 * NEVER use AuthContext.user to initialize or update profile form fields.
 * This will cause fields to be cleared when /me refreshes after saves.
 * 
 * This separation prevents the "profile fields cleared after save" bug.
 * 
 * @see AthleteProfileSection.tsx for correct profile hydration pattern
 */
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
    let isResolved = false;
    
    const resolveAuth = (newStatus: AuthStatus, newUser: AuthUser | null) => {
      if (isResolved) {
        return;
      }
      isResolved = true;
      setUser(newUser);
      setStatus(newStatus);
      setLoading(false);
      console.log(`[AuthContext] Auth resolved: ${newStatus}`);
    };
    
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
          resolveAuth("unauthenticated", null);
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
          resolveAuth("unauthenticated", null);
        } else {
          console.log("[AuthContext] /me succeeded, setting authenticated");
          resolveAuth("authenticated", currentUser);
        }
      } catch (error) {
        console.error("[AuthContext] Bootstrap error:", error);
        // Any error = unauthenticated (don't assume authenticated)
        resolveAuth("unauthenticated", null);
      }
    };
    
    // Safety timeout: Force resolution after 4 seconds to prevent infinite loading
    // This prevents deadlock if fetchCurrentUser() hangs or network fails silently
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        console.warn("[AuthContext] Bootstrap timeout (4s) - forcing unauthenticated state");
        resolveAuth("unauthenticated", null);
      }
    }, 4000);
    
    bootstrapAuth().finally(() => {
      clearTimeout(timeoutId);
    });
  }, []);

  // authReady = auth check is complete (not bootstrapping)
  const authReady = !loading && status !== "bootstrapping";

  return (
    <AuthContext.Provider value={{ user, loading, status, authReady, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
