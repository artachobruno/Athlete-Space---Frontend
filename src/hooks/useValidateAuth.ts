import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

/**
 * Hook to validate authentication on app load.
 * Uses /me endpoint to check if HTTP-only cookie is valid.
 * Redirects to login if authentication fails.
 */
export function useValidateAuth() {
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateAuth = async () => {
      // Use /me endpoint to validate HTTP-only cookie
      try {
        // Interceptor returns response.data directly, so api.get() returns the data
        const data = await api.get("/me");
        
        console.log('[useValidateAuth] /me data:', data);
        
        // Validate data is not undefined/null
        // Accept any object response - backend may return {"user_id": "...", "authenticated": true}
        // or full UserOut object - both are valid
        if (!data || typeof data !== 'object') {
          console.warn('[Auth] /me returned invalid data:', data);
          setIsValid(false);
          setIsValidating(false);
          navigate('/login', { replace: true });
          return;
        }
        
        // Check if data is empty object (which means backend returned null/undefined)
        // Empty object from interceptor means backend didn't return valid data
        const dataKeys = Object.keys(data);
        if (dataKeys.length === 0) {
          console.warn('[Auth] /me returned empty data');
          setIsValid(false);
          setIsValidating(false);
          navigate('/login', { replace: true });
          return;
        }
        
        // If we have a non-empty object response, cookie is valid
        // Backend may return {"user_id": "...", "authenticated": true} or full UserOut
        // Both are valid - we just need to know the user is authenticated
        console.log('[useValidateAuth] Cookie is valid, data has keys:', dataKeys);
        setIsValid(true);
        setIsValidating(false);
      } catch (error) {
        const apiError = error as { status?: number };
        
        // 401 = authentication failure (cookie missing/invalid)
        if (apiError.status === 401) {
          console.log('[Auth] /me returned 401 - not authenticated, redirecting to login');
          setIsValid(false);
          setIsValidating(false);
          navigate('/login', { replace: true });
          return;
        }
        
        // 404 = backend contract violation - /me should NEVER return 404
        // DEFENSIVE FIX: Don't logout on 404, treat as temporary issue
        // Backend should be fixed to return 401 instead of 404
        if (apiError.status === 404) {
          console.error(
            '[Auth] /me returned 404 - BACKEND CONTRACT VIOLATION. ' +
            'Defensive fix: NOT redirecting to login. Backend should return 401 instead of 404.'
          );
          // Treat as valid to avoid false logout
          // User might still be authenticated, backend just has a bug
          setIsValid(true);
          setIsValidating(false);
          return;
        }
        
        // Other errors (network, 500, etc.) - don't treat as auth failure
        // Network errors = temporary issue, don't redirect
        // 500 = server error, but user might still be authenticated
        console.warn('[Auth] /me error (not auth failure):', apiError.status);
        // Treat as valid to avoid redirecting on temporary errors
        // Note: This means network errors won't trigger logout, which is correct
        setIsValid(true);
        setIsValidating(false);
      }
    };

    validateAuth();
    // Run once on mount, not on every route change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isValidating, isValid };
}

