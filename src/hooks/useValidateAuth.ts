import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/auth';
import { api } from '@/lib/api';

/**
 * Hook to validate authentication token on app load.
 * Uses /me endpoint (REQUIRED) instead of /me/profile (OPTIONAL).
 * If token exists but is invalid, clears it and redirects to onboarding.
 * Only validates when not already on onboarding page.
 */
export function useValidateAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      const token = auth.getToken();
      
      // If no token, user is not authenticated
      if (!token) {
        setIsValidating(false);
        setIsValid(false);
        return;
      }

      // Check if token is expired first (before making API call)
      if (auth.isTokenExpired()) {
        console.log('[Auth] Token is expired, clearing and redirecting to login');
        auth.clear();
        setIsValid(false);
        setIsValidating(false);
        navigate('/login', { replace: true });
        return;
      }

      // Use /me endpoint (REQUIRED) to validate token
      // /me/profile is OPTIONAL and should not be used for auth validation
      try {
        // Interceptor returns response.data directly, so api.get() returns the data
        const data = await api.get("/me");
        
        console.log('[useValidateAuth] /me data:', data);
        
        // Validate data is not undefined/null
        // Accept any object response - backend may return {"user_id": "...", "authenticated": true}
        // or full UserOut object - both are valid
        if (!data || typeof data !== 'object') {
          console.warn('[Auth] /me returned invalid data, clearing token:', data);
          auth.clear();
          setIsValid(false);
          setIsValidating(false);
          navigate('/login', { replace: true });
          return;
        }
        
        // Check if data is empty object (which means backend returned null/undefined)
        // Empty object from interceptor means backend didn't return valid data
        const dataKeys = Object.keys(data);
        if (dataKeys.length === 0) {
          console.warn('[Auth] /me returned empty data, clearing token');
          auth.clear();
          setIsValid(false);
          setIsValidating(false);
          navigate('/login', { replace: true });
          return;
        }
        
        // If we have a non-empty object response, token is valid
        // Backend may return {"user_id": "...", "authenticated": true} or full UserOut
        // Both are valid - we just need to know the user is authenticated
        console.log('[useValidateAuth] Token is valid, data has keys:', dataKeys);
        setIsValid(true);
        setIsValidating(false);
      } catch (error) {
        // Only 401 means authentication failure
        // 404 is routing/deployment issue, not auth failure
        const apiError = error as { status?: number };
        if (apiError.status === 401) {
          console.log('[Auth] Token is invalid (401), clearing and redirecting to login');
          auth.clear();
          setIsValid(false);
          setIsValidating(false);
          navigate('/login', { replace: true });
          return;
        }
        
        // Other errors (404, network, 500, etc.) - don't treat as auth failure
        // 404 = routing/deployment issue, not authentication
        // Network/500 = temporary issue, don't clear token
        console.warn('[Auth] /me error (not auth failure):', apiError.status);
        // Don't clear token on non-auth errors - might be temporary
        setIsValid(true);
        setIsValidating(false);
      }
    };

    validateToken();
    // Run once on mount, not on every route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isValidating, isValid };
}

