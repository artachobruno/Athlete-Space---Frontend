import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '@/lib/auth';
import { fetchUserProfile } from '@/lib/api';

/**
 * Hook to validate authentication token on app load.
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

      // Try to fetch profile to validate token
      try {
        await fetchUserProfile();
        // If successful, token is valid
        setIsValid(true);
        setIsValidating(false);
      } catch (error) {
        // Check if it's a 401 error (invalid token)
        const apiError = error as { status?: number };
        if (apiError.status === 401) {
          // Token is invalid - clear it
          console.log('[Auth] Token is invalid (401), clearing and redirecting to login');
          auth.clear();
          setIsValid(false);
          setIsValidating(false);
          // Only redirect if not already on login or onboarding
          if (location.pathname !== '/login' && location.pathname !== '/onboarding') {
            navigate('/login', { replace: true });
          }
        } else {
          // Other error (network, etc.) - assume token might still be valid
          // Don't clear token on network errors
          setIsValid(true);
          setIsValidating(false);
        }
      }
    };

    validateToken();
  }, [navigate, location.pathname]);

  return { isValidating, isValid };
}

