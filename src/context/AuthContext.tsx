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
  useEffect(() => {
    const bootstrapAuth = async () => {
      console.log("[AuthContext] Bootstrapping auth...");
      
      // Call /me to check authentication (HTTP-only cookie handles auth)
      // No need to check for localStorage tokens - cookies are the source of truth
      try {
        const currentUser = await fetchCurrentUser();
        
        if (!currentUser) {
          console.log("[AuthContext] /me returned null, setting unauthenticated");
          setStatus("unauthenticated");
        } else {
          console.log("[AuthContext] /me succeeded, setting authenticated");
          setUser(currentUser);
          setStatus("authenticated");
        }
      } catch (error) {
        console.error("[AuthContext] Bootstrap error:", error);
        setStatus("unauthenticated");
      } finally {
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
