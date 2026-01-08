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
      
      // Null means no token or unauthenticated - this is expected, not an error
      if (!currentUser) {
        setUser(null);
        setStatus("unauthenticated");
      } else {
        // User is authenticated
        setUser(currentUser);
        setStatus("authenticated");
      }
    } catch (error) {
      console.error("[AuthContext] Unexpected error:", error);
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
