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
      // Don't validate if already on login or onboarding page
      if (location.pathname === '/login' || 
          location.pathname === '/onboarding' || 
          location.pathname.startsWith('/onboarding/')) {
        setIsValidating(false);
        return;
      }

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
        // Only redirect if not already on login or onboarding
        if (location.pathname !== '/login' && location.pathname !== '/onboarding') {
          navigate('/login', { replace: true });
        }
        return;
      }

      // Use /me endpoint (REQUIRED) to validate token
      // /me/profile is OPTIONAL and should not be used for auth validation
      try {
        const response = await api.get("/me");
        
        // Validate response is not undefined/null
        if (!response || typeof response !== 'object') {
          console.warn('[Auth] /me returned invalid response, clearing token');
          auth.clear();
          setIsValid(false);
          setIsValidating(false);
          if (location.pathname !== '/login' && location.pathname !== '/onboarding') {
            navigate('/login', { replace: true });
          }
          return;
        }
        
        // If successful, token is valid
        setIsValid(true);
        setIsValidating(false);
      } catch (error) {
        // Check if it's a 401 or 404 error (invalid token or endpoint broken)
        const apiError = error as { status?: number };
        if (apiError.status === 401 || apiError.status === 404) {
          // Token is invalid OR endpoint doesn't exist = not authenticated
          // 404 on /me means backend contract is broken, but from frontend perspective = not authenticated
          console.log(`[Auth] Token is invalid (${apiError.status}), clearing and redirecting to login`);
          auth.clear();
          setIsValid(false);
          setIsValidating(false);
          // Only redirect if not already on login or onboarding
          if (location.pathname !== '/login' && location.pathname !== '/onboarding') {
            navigate('/login', { replace: true });
          }
        } else {
          // Other error (network, 500, etc.) - assume token might still be valid
          // Don't clear token on network errors - might be temporary
          setIsValid(true);
          setIsValidating(false);
        }
      }
    };

    validateToken();
  }, [navigate, location.pathname]);

  return { isValidating, isValid };
}

