import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCurrentUser, logout as logoutApi, type AuthUser } from "@/lib/auth";

export type AuthStatus = "loading" | "unauthenticated" | "authenticated";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  status: AuthStatus;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  status: "loading",
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
      const currentUser = await fetchCurrentUser();
      
      console.log("[AuthContext] fetchCurrentUser returned:", currentUser);
      
      // Explicitly handle null/undefined as unauthenticated
      if (!currentUser || typeof currentUser !== 'object') {
        console.log("[AuthContext] No user found - setting unauthenticated state");
        setUser(null);
        setStatus("unauthenticated");
        setLoading(false);
        return;
      }
      
      // User is authenticated
      console.log("[AuthContext] Setting user:", currentUser);
      setUser(currentUser);
      setStatus("authenticated");
    } catch (error) {
      // Check if error is actually an auth failure (401) vs other errors
      const apiError = error as { status?: number };
      console.error("[AuthContext] Failed to fetch user:", error);
      
      // Only set unauthenticated on actual auth failures (401)
      // For other errors, keep existing state (don't change on transient errors)
      if (apiError.status === 401) {
        console.log("[AuthContext] Auth failed (401), setting unauthenticated");
        setUser(null);
        setStatus("unauthenticated");
      } else {
        // For other errors, if we have no user, set unauthenticated
        // Otherwise keep existing state (might be transient network error)
        if (!user) {
          console.log("[AuthContext] Non-auth error with no existing user, setting unauthenticated");
          setStatus("unauthenticated");
        } else {
          console.warn("[AuthContext] Non-auth error, keeping existing authenticated state");
          // Keep existing user and status
        }
      }
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

  // On app boot, check if user is authenticated
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, status, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
