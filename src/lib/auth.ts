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
    localStorage.removeItem(TOKEN_KEY);
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
    const response = await api.post("/auth/login", { email, password });
    
    // Log RAW response for debugging
    console.log("[LOGIN] RAW RESPONSE:", response);
    console.log("[LOGIN] RESPONSE.DATA:", response.data);
    console.log("[LOGIN] RESPONSE.DATA KEYS:", Object.keys(response.data || {}));
    
    // Extract token from correct field (access_token, not token)
    // API interceptor returns response.data directly, so response IS the data
    const responseData = response && typeof response === 'object' ? response : {};
    // Try both access_token and token for backward compatibility
    const token = (responseData as { access_token?: string; token?: string }).access_token 
      || (responseData as { access_token?: string; token?: string }).token;
    
    // Verify token exists and store immediately
    if (!token || typeof token !== 'string') {
      console.error("[LOGIN] access_token/token missing from response", responseData);
      throw new Error("Login succeeded but access_token missing from response");
    }
    
    console.log("[LOGIN] Token extracted. Length:", token.length);
    console.log("[LOGIN] Token preview:", token.substring(0, 20) + "...");
    
    // Store token immediately (no conditionals)
        auth.setToken(token);
    
    // Verify token was stored
    const storedToken = auth.getToken();
    if (!storedToken || storedToken !== token) {
      console.error("[LOGIN] Token storage failed!", {
        expected: token.substring(0, 20),
        stored: storedToken?.substring(0, 20),
      });
      throw new Error("Failed to store authentication token");
    }
    
    console.log("[LOGIN] Token stored successfully. Length:", storedToken.length);
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
    const response = await api.post("/auth/signup", { email, password });
    
    // STEP 1: Log RAW response for debugging
    console.log("[SIGNUP] RAW RESPONSE:", response);
    console.log("[SIGNUP] RESPONSE.DATA:", response.data);
    console.log("[SIGNUP] RESPONSE.DATA KEYS:", Object.keys(response.data || {}));
    
    // STEP 2: Extract token from correct field (access_token, not token)
    // API interceptor returns response.data directly, so response IS the data
    const responseData = response && typeof response === 'object' ? response : {};
    const token = (responseData as { access_token?: string }).access_token;
    
    // STEP 3: Verify token exists and store immediately
    if (!token || typeof token !== 'string') {
      console.error("[SIGNUP] access_token missing from response", responseData);
      throw new Error("Signup succeeded but access_token missing from response");
    }
    
    console.log("[SIGNUP] Token extracted. Length:", token.length);
    console.log("[SIGNUP] Token preview:", token.substring(0, 20) + "...");
    
    // Store token immediately (no conditionals)
        auth.setToken(token);
    
    // Verify token was stored
    const storedToken = auth.getToken();
    if (!storedToken || storedToken !== token) {
      console.error("[SIGNUP] Token storage failed!", {
        expected: token.substring(0, 20),
        stored: storedToken?.substring(0, 20),
      });
      throw new Error("Failed to store authentication token");
    }
    
    console.log("[SIGNUP] Token stored successfully. Length:", storedToken.length);
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
    if (import.meta.env.PROD) {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
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
 */
export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    // Still clear local auth state even if API call fails
  } finally {
    auth.clear();
  }
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
  // If no token exists, don't even try to fetch
  const token = auth.getToken();
  if (!token) {
    console.log("[Auth] No token found, skipping /me call");
    return null;
  }
  
  // If token is expired, clear it and return null
  if (auth.isTokenExpired()) {
    console.log("[Auth] Token is expired, clearing");
    auth.clear();
    return null;
  }
  
  // If a request is already in flight, return the same promise
  if (fetchCurrentUserPromise) {
    return fetchCurrentUserPromise;
  }
  
  fetchCurrentUserPromise = (async () => {
    try {
      // /me endpoint is REQUIRED - this validates authentication
      const response = await api.get("/me");
      
      console.log("[Auth] /me response received:", response);
      
      // Validate response is not undefined/null
      if (!response || typeof response !== 'object') {
        console.warn("[Auth] /me returned invalid response:", response);
        auth.clear();
        return null;
      }
      
      // Backend may return minimal response: {"user_id": "...", "authenticated": true}
      // Or full UserOut: {"id": "...", "email": "...", "onboarding_complete": true, "strava_connected": true}
      // Transform it to match expected AuthUser shape
      const backendResponse = response as { user_id?: string; id?: string; authenticated?: boolean; email?: string | null; onboarding_complete?: boolean; strava_connected?: boolean };
      
      console.log("[Auth] Parsed backend response:", backendResponse);
      
      // Extract user_id or id (backend may use either)
      const userId = backendResponse.id || backendResponse.user_id;
      if (!userId) {
        console.warn("[Auth] /me response missing user_id/id:", response);
        auth.clear();
        return null;
      }
      
      // Create a valid user object from the response
      // Email is mandatory - if backend doesn't provide it, this is an error state
      if (!backendResponse.email) {
        console.warn("[Auth] /me response missing email (email is mandatory):", response);
        auth.clear();
        return null;
      }
      
      const userProfile: AuthUser = {
        id: userId,
        email: backendResponse.email,
        onboarding_complete: backendResponse.onboarding_complete ?? false,
        strava_connected: backendResponse.strava_connected ?? false,
      };
      
      console.log("[Auth] Created user profile:", userProfile);
      
      return userProfile;
    } catch (error) {
      const apiError = error as { status?: number };
      
      // 401 = not authenticated (handled by interceptor, but clear here too)
      // 404 = endpoint doesn't exist OR user doesn't exist = not authenticated
      if (apiError.status === 401 || apiError.status === 404) {
        // User is not authenticated or endpoint is broken
        auth.clear();
        return null;
      }
      
      // For other errors (network, 500, etc.), log and return null
      // Don't clear token on network errors - might be temporary
      console.warn("[Auth] Failed to fetch /me:", error);
      return null;
    } finally {
      // Clear the promise so future calls can make new requests
      fetchCurrentUserPromise = null;
    }
  })();
  
  return fetchCurrentUserPromise;
}

