import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchCurrentUser, logout as logoutApi, type AuthUser } from "@/lib/auth";
import { wasOnboardingCompleted } from "@/lib/storage";

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
        // CRITICAL: If backend says onboarding_complete is false but localStorage flag says it was completed,
        // use the localStorage flag as a safeguard against backend bugs
        const localStorageSaysComplete = wasOnboardingCompleted();
        let finalUser = currentUser;
        if (!currentUser.onboarding_complete && localStorageSaysComplete) {
          console.warn("[AuthContext] ⚠️ Backend bug detected: onboarding_complete is false but localStorage flag says it was completed.");
          console.warn("[AuthContext] Using localStorage flag as fallback. Backend should preserve onboarding_complete after Strava connection.");
          // Override the backend value with the localStorage flag
          finalUser = {
            ...currentUser,
            onboarding_complete: true,
          };
        }
        setUser(finalUser);
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
