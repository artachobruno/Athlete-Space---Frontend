import { api } from "./api";
import type { UserOut } from "./apiValidation";
import type { AthleteProfile } from "@/types";
import { Browser } from "@/lib/capacitor-stubs/browser";
import { isNative } from "./platform";

// Minimal user type for auth context (matches what /me returns)
// This is a subset of the full profile - just enough for authentication
// Email is now mandatory - all users must have credentials
export type AuthUser = {
  id: string;
  email: string; // Required - all users must have email
  onboarding_complete: boolean;
  strava_connected: boolean;
  role?: 'athlete' | 'coach'; // User role for dashboard routing
  timezone?: string; // IANA timezone string (e.g., "America/Chicago")
};

const TOKEN_KEY = "auth_token";

/**
 * Checks if a JWT token is expired.
 * JWT tokens have 3 parts: header.payload.signature
 * The expiration time (exp) is in the payload.
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  
  try {
    // JWT tokens have 3 parts: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      // Invalid token format
      return true;
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1]));
    const exp = payload.exp;
    
    if (!exp) {
      // No expiration claim - consider it expired for safety
      return true;
    }
    
    // Convert to milliseconds and check if expired
    const expTime = exp * 1000;
    const isExpired = Date.now() >= expTime;
    
    if (isExpired) {
      console.log('[Auth] Token expired:', {
        expiredAt: new Date(expTime).toISOString(),
        now: new Date().toISOString(),
      });
    }
    
    return isExpired;
  } catch (error) {
    // If we can't parse it, consider it expired/invalid
    console.warn('[Auth] Failed to parse token:', error);
    return true;
  }
}

export const auth = {
  getToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  
  clear: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
  
  /**
   * Checks if user is logged in (has a valid, non-expired token).
   */
  isLoggedIn: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;
    
    // Check if token is expired
    if (isTokenExpired(token)) {
      // Auto-clear expired token
      localStorage.removeItem(TOKEN_KEY);
      return false;
    }
    
    return true;
  },
  
  /**
   * Checks if the current token is expired without clearing it.
   * Useful for checking before making API calls.
   * 
   * Note: This does NOT clear the token - it only checks expiration.
   */
  isTokenExpired: (): boolean => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return true; // No token = expired
    return isTokenExpired(token);
  },
  
  /**
   * Gets token expiration date if available.
   */
  getTokenExpiration: (): Date | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload.exp;
      
      if (!exp) return null;
      
      return new Date(exp * 1000);
    } catch {
      return null;
    }
  },
  
  logout: (): void => {
    // No localStorage token to clear - cookies are cleared by backend /auth/logout
    // This function is kept for API compatibility but does nothing
  },
};

/**
 * Centralized authentication API calls.
 * All auth-related API calls should go through these functions.
 */

/**
 * Login with email and password.
 * Backend returns: {"access_token": "...", "token_type": "bearer", "user_id": "...", "email": "..."} on success
 * Backend returns: {"error": "user_not_found", "message": "..."} with 404
 * Backend returns: {"error": "invalid_credentials", "message": "..."} with 401
 * @throws Error with status code: 404 (account not found), 401 (wrong password), 500 (server error)
 */
export async function loginWithEmail(email: string, password: string): Promise<void> {
  try {
    // Login endpoint sets HTTP-only cookie automatically
    // No need to store tokens in localStorage - cookies handle authentication
    const response = await api.post("/auth/login", { email, password });
    
    // Log response for debugging
    console.log("[LOGIN] Login successful, HTTP-only cookie set by backend");
    console.log("[LOGIN] Response:", response);
    
    // Success - cookie is automatically set by backend with credentials: 'include'
    // Verify login worked by checking if response indicates success
    if (!response) {
      throw new Error("Login response was empty");
    }
    
    console.log("[LOGIN] ✅ Authentication cookie set successfully");
  } catch (error) {
    // normalizeError already extracts message from backend's {"message": "..."} format
    const apiError = error as { status?: number; message?: string; details?: unknown };
    throw {
      status: apiError.status || 500,
      message: apiError.message || "Login failed",
      details: apiError.details,
    };
  }
}

/**
 * Sign up with email and password.
 * Backend returns: {"access_token": "...", "token_type": "bearer", "user_id": "...", "email": "..."} on success
 * Backend returns: {"error": "email_already_exists", "message": "..."} with 409
 * @throws Error with status code: 409 (account exists), 400 (validation error), 500 (server error)
 */
export async function signupWithEmail(email: string, password: string): Promise<void> {
  try {
    // Signup endpoint sets HTTP-only cookie automatically
    // No need to store tokens in localStorage - cookies handle authentication
    const response = await api.post("/auth/signup", { email, password });
    
    // Log response for debugging
    console.log("[SIGNUP] Signup successful, HTTP-only cookie set by backend");
    console.log("[SIGNUP] Response:", response);
    
    // Success - cookie is automatically set by backend with credentials: 'include'
    // Verify signup worked by checking if response indicates success
    if (!response) {
      throw new Error("Signup response was empty");
    }
    
    console.log("[SIGNUP] ✅ Authentication cookie set successfully");
  } catch (error) {
    // normalizeError already extracts message from backend's {"message": "..."} format
    const apiError = error as { status?: number; message?: string; details?: unknown };
    throw {
      status: apiError.status || 500,
      message: apiError.message || "Signup failed",
      details: apiError.details,
    };
  }
}

/**
 * Login with Google OAuth.
 * Handles both web (redirect) and mobile (in-app browser) platforms.
 */
export async function loginWithGoogle(): Promise<void> {
  // Get API base URL (same logic as api.ts)
  const getBaseURL = () => {
    // Check if we're in Capacitor (native app)
    const isCapacitor = typeof window !== 'undefined' && (
      window.location.protocol === 'capacitor:' ||
      window.location.origin === 'capacitor://localhost' ||
      window.location.href.startsWith('capacitor://')
    );
    
    if (isCapacitor) {
      // In Capacitor, we MUST use VITE_API_URL - capacitor://localhost is not a valid backend URL
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        console.error("[Auth] VITE_API_URL is required in Capacitor/native builds but is not set!");
        console.error("[Auth] VITE_API_URL must be set when running 'npm run build' before syncing to iOS.");
        console.error("[Auth] Example: VITE_API_URL=https://your-backend.com npm run build");
        throw new Error("Backend API URL is not configured. Please set VITE_API_URL environment variable when building.");
      }
      return apiUrl;
    }
    
    // Safety check: if origin is capacitor://localhost, we're definitely in Capacitor
    if (import.meta.env.PROD && typeof window !== 'undefined') {
      if (window.location.origin === 'capacitor://localhost' || window.location.href.startsWith('capacitor://')) {
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          console.error("[Auth] CRITICAL: Running in Capacitor but VITE_API_URL was not set at build time!");
          throw new Error("Backend API URL is not configured. Please set VITE_API_URL when building.");
        }
        return apiUrl;
      }
    }
    
    if (import.meta.env.PROD) {
      // CRITICAL: In production, VITE_API_URL is REQUIRED
      // Never fall back to window.location.origin - frontend and backend are on different domains
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        const errorMsg = "[Auth] CRITICAL: VITE_API_URL is required in production but is not set! " +
                        "Please configure VITE_API_URL in your deployment environment (e.g., Render dashboard). " +
                        "Example: VITE_API_URL=https://virtus-ai.onrender.com";
        console.error(errorMsg);
        console.error("[Auth] Current window.location.origin:", window.location.origin);
        throw new Error("VITE_API_URL environment variable is required in production. Please configure it in your deployment settings.");
      }
      return apiUrl;
    }
    return "http://localhost:8000";
  };
  
  const API = getBaseURL();
  const url = `${API}/auth/google/login?platform=${isNative ? "mobile" : "web"}`;

  if (isNative) {
    // Mobile: Open in-app browser
    try {
      await Browser.open({
        url,
        presentationStyle: "fullscreen",
      });
    } catch (error) {
      // Fallback to window.location if Capacitor is not available
      console.warn("[Auth] Capacitor Browser not available, falling back to redirect:", error);
      window.location.href = url;
    }
  } else {
    // Web: Standard redirect
    window.location.href = url;
  }
}

/**
 * Logout the current user.
 * Note: Logout is primarily about clearing local auth state.
 * If the backend endpoint doesn't exist (404), we still treat it as success.
 */
export async function logout(): Promise<void> {
  try {
    // Backend /auth/logout endpoint clears the HTTP-only cookie
    await api.post("/auth/logout");
    console.log("[Auth] ✅ Logout successful, cookie cleared by backend");
  } catch (error) {
    // Handle 404 gracefully - endpoint might not exist, but logout is still successful
    const apiError = error as { status?: number; message?: string };
    if (apiError.status === 404) {
      // 404 means endpoint doesn't exist - this is fine
      if (import.meta.env.DEV) {
        console.log("[Auth] Logout endpoint not found (404) - continuing");
      }
    } else {
      // Log other errors in development
      if (import.meta.env.DEV) {
        console.error("[Auth] Logout error:", error);
      }
    }
    // Cookie will be cleared by backend if endpoint exists
  }
  // No localStorage token to clear - cookies are the source of truth
}

// Guard to prevent multiple simultaneous calls to /me
let fetchCurrentUserPromise: Promise<AuthUser | null> | null = null;

/**
 * Fetch current user profile.
 * Uses /me endpoint (REQUIRED for auth).
 * /me/profile is OPTIONAL and fetched separately if needed.
 * 
 * @returns User profile if authenticated, null otherwise
 */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // If a request is already in flight, return the same promise
  if (fetchCurrentUserPromise) {
    return fetchCurrentUserPromise;
  }
  
  fetchCurrentUserPromise = (async () => {
    try {
      // /me endpoint validates authentication via HTTP-only cookie
      // No need to check for localStorage tokens - cookies handle auth automatically
      const response = await api.get("/me");
      
      console.log("[Auth] /me response received:", response);
      
      // Validate response is not undefined/null
      if (!response || typeof response !== 'object') {
        console.warn("[Auth] /me returned invalid response:", response);
        return null;
      }
      
      // Backend may return minimal response: {"user_id": "...", "authenticated": true}
      // Or full UserOut: {"id": "...", "email": "...", "onboarding_complete": true, "strava_connected": true}
      // Transform it to match expected AuthUser shape
      const backendResponse = response as { user_id?: string; id?: string; authenticated?: boolean; email?: string | null; onboarding_complete?: boolean; strava_connected?: boolean; timezone?: string };
      
      console.log("[Auth] Parsed backend response:", backendResponse);
      
      // Extract user_id or id (backend may use either)
      const userId = backendResponse.id || backendResponse.user_id;
      if (!userId) {
        console.warn("[Auth] /me response missing user_id/id:", response);
        return null;
      }
      
      // Create a valid user object from the response
      // Email is mandatory - if backend doesn't provide it, this is an error state
      if (!backendResponse.email) {
        console.warn("[Auth] /me response missing email (email is mandatory):", response);
        return null;
      }
      
      const userProfile: AuthUser = {
        id: userId,
        email: backendResponse.email,
        onboarding_complete: backendResponse.onboarding_complete ?? false,
        strava_connected: backendResponse.strava_connected ?? false,
        role: (backendResponse as { role?: 'athlete' | 'coach' }).role,
        timezone: backendResponse.timezone || "UTC",
      };
      
      console.log("[Auth] Created user profile:", userProfile);
      
      return userProfile;
    } catch (error) {
      const apiError = error as { status?: number };
      
      // 401 = not authenticated (cookie missing/invalid) - CORRECT behavior
      if (apiError.status === 401) {
        console.log("[Auth] /me returned 401 - user not authenticated (cookie missing/invalid)");
        return null;
      }
      
      // 404 = backend contract violation - /me should NEVER return 404
      // Should be 200 (authenticated), 401 (not authenticated), or 500 (server error)
      // DEFENSIVE FIX: Return null (not authenticated) but don't trigger logout
      // Backend should be fixed to return 401 instead of 404
      if (apiError.status === 404) {
        console.error(
          "[Auth] /me returned 404 - BACKEND CONTRACT VIOLATION. " +
          "/me must NEVER return 404. Backend should return 401 instead. " +
          "Defensive fix: Returning null (not authenticated) but NOT triggering logout."
        );
        return null;
      }
      
      // For other errors (network, 500, etc.), log and return null
      // Don't treat network errors as auth failure - might be temporary
      // But 500 on /me is also a backend issue that should be investigated
      if (apiError.status === 500) {
        console.error("[Auth] /me returned 500 - backend server error. Treating as not authenticated.");
      } else {
        console.warn("[Auth] Failed to fetch /me:", error);
      }
      return null;
    } finally {
      // Clear the promise so future calls can make new requests
      fetchCurrentUserPromise = null;
    }
  })();
  
  return fetchCurrentUserPromise;
}

