import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCurrentUser, logout as logoutApi, type AuthUser } from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshUser = async () => {
    // Prevent multiple simultaneous calls
    if (isRefreshing) {
      return;
    }
    
    setIsRefreshing(true);
    try {
      const currentUser = await fetchCurrentUser();
      
      console.log("[AuthContext] fetchCurrentUser returned:", currentUser);
      
      // Validate response is not undefined/null
      if (!currentUser || typeof currentUser !== 'object') {
        console.warn("[AuthContext] /me returned invalid response:", currentUser);
        // Only clear user if we're certain auth failed (not on transient errors)
        // Don't clear on network errors or other non-auth failures
        setUser(null);
        setLoading(false);
        return;
      }
      
      console.log("[AuthContext] Setting user:", currentUser);
      setUser(currentUser);
    } catch (error) {
      // Check if error is actually an auth failure (401) vs other errors
      const apiError = error as { status?: number };
      console.error("[AuthContext] Failed to fetch user:", error);
      
      // Only clear user on actual auth failures (401)
      // Don't clear on network errors, 404, 500, etc. - might be temporary
      if (apiError.status === 401) {
        console.warn("[AuthContext] Auth failed (401), clearing user");
        setUser(null);
      } else {
        // For other errors, keep existing user state (don't clear on transient errors)
        console.warn("[AuthContext] Non-auth error, keeping existing user state");
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
      setLoading(false);
    }
  };

  // On app boot, check if user is authenticated
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
