import { api } from "./api";
import type { AthleteProfile } from "@/types";

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
 * Backend returns: {"token": "..."} on success
 * Backend returns: {"error": "user_not_found", "message": "..."} with 404
 * Backend returns: {"error": "invalid_credentials", "message": "..."} with 401
 * @throws Error with status code: 404 (account not found), 401 (wrong password), 500 (server error)
 */
export async function loginWithEmail(email: string, password: string): Promise<void> {
  try {
    const response = await api.post("/auth/login", { email, password });
    // Backend returns token in response: {"token": "..."}
    if (response && typeof response === 'object' && 'token' in response) {
      const token = (response as { token: string }).token;
      if (token && typeof token === 'string') {
        auth.setToken(token);
      } else {
        throw new Error("Backend returned invalid token format");
      }
    } else {
      throw new Error("Backend did not return a token");
    }
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
 * Backend returns: {"token": "..."} on success
 * Backend returns: {"error": "email_already_exists", "message": "..."} with 409
 * @throws Error with status code: 409 (account exists), 400 (validation error), 500 (server error)
 */
export async function signupWithEmail(email: string, password: string): Promise<void> {
  try {
    const response = await api.post("/auth/signup", { email, password });
    // Backend returns token in response: {"token": "..."}
    if (response && typeof response === 'object' && 'token' in response) {
      const token = (response as { token: string }).token;
      if (token && typeof token === 'string') {
        auth.setToken(token);
      } else {
        throw new Error("Backend returned invalid token format");
      }
    } else {
      throw new Error("Backend did not return a token");
    }
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

/**
 * Fetch current user profile.
 * Tries /me endpoint first, falls back to /me/profile if /me doesn't exist.
 * @returns User profile if authenticated, null otherwise
 */
export async function fetchCurrentUser(): Promise<AthleteProfile | null> {
  try {
    // Try /me endpoint first (as per auth specs)
    const response = await api.get("/me");
    return response as unknown as AthleteProfile;
  } catch (error) {
    const apiError = error as { status?: number };
    
    // If /me doesn't exist (404), try /me/profile (existing endpoint)
    if (apiError.status === 404) {
      try {
        const profileResponse = await api.get("/me/profile");
        return profileResponse as unknown as AthleteProfile;
      } catch (profileError) {
        const profileApiError = profileError as { status?: number };
        if (profileApiError.status === 401) {
          auth.clear();
          return null;
        }
        throw profileError;
      }
    }
    
    if (apiError.status === 401) {
      // User is not authenticated
      auth.clear();
      return null;
    }
    
    throw error;
  }
}

