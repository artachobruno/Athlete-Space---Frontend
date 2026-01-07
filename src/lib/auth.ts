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

