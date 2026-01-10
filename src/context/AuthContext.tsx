import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCurrentUser, logout as logoutApi, type AuthUser } from "@/lib/auth";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated";

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
  status: "loading",
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
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent multiple simultaneous calls
    if (isRefreshing) {
      return;
    }
    
    setIsRefreshing(true);
    setLoading(true);
    setStatus("loading");
    
    try {
      // CRITICAL: Enforce token → /me ordering
      // Step 1: Check if token exists (synchronous check)
      const token = localStorage.getItem('auth_token');
      if (!token || token === 'null' || token.trim() === '') {
        // No token = unauthenticated (don't call /me)
        console.log("[AuthContext] No token found, setting unauthenticated");
        setUser(null);
        setStatus("unauthenticated");
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Step 2: Call /me to validate token and get user
      // This is the ONLY way to set status to "authenticated"
      const currentUser = await fetchCurrentUser();
      
      // CRITICAL: Only set "authenticated" if /me succeeded
      // If /me returns null, it means token is invalid or expired
      if (!currentUser) {
        // /me failed = unauthenticated (token was invalid/expired)
        console.log("[AuthContext] /me returned null, setting unauthenticated");
        setUser(null);
        setStatus("unauthenticated");
      } else {
        // /me succeeded = authenticated
        // CRITICAL: Backend is source of truth for onboarding_complete
        // Never override backend state with localStorage
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

  // On app boot, check if user is authenticated
  useEffect(() => {
    refreshUser();
  }, []);

  // authReady = auth check is complete (not loading)
  const authReady = !loading && status !== "loading";

  return (
    <AuthContext.Provider value={{ user, loading, status, authReady, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
