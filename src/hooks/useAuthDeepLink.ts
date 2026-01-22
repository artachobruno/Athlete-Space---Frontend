import { useEffect } from "react";
import { Browser } from "@/lib/capacitor-stubs/browser";
import { isNative } from "@/lib/platform";
import { useAuth } from "@/context/AuthContext";
import { storeAccessToken } from "@/lib/tokenStorage";

/**
 * Hook to handle OAuth deep links in native apps.
 * 
 * CRITICAL: The deep link listener is registered at module load time (registerDeepLinks.ts)
 * to ensure it exists before iOS delivers deep links after OAuth. This hook listens for
 * the custom 'oauth-callback' event dispatched by the top-level listener.
 * 
 * When Google OAuth completes, the backend redirects to athletespace://auth/callback
 * with access_token and expires_in query parameters. This hook handles that URL and:
 * 1. Extracts access_token and expires_in from the URL
 * 2. Stores the token securely in Capacitor Preferences (mobile) or localStorage (web)
 * 3. Closes the in-app browser (if open)
 * 4. Calls refreshUser() which uses the stored token to authenticate via /me
 * 5. Navigates to the home screen
 * 
 * CRITICAL: For mobile OAuth with external browser (Browser.open()), cookies set in Safari
 * are NOT accessible to the WebView. The backend MUST include access_token in the redirect
 * URL, which this hook extracts and stores. The API interceptor then uses this token
 * to send Authorization: Bearer <token> headers for all API requests.
 */
export function useAuthDeepLink(onDeepLink?: () => void) {
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!isNative()) {
      console.log('[AuthDeepLink] Skipping deep link handler (not native)');
      return;
    }

    console.log('[AuthDeepLink] Registering oauth-callback event listener (React hook)');
    
    const handleOAuthCallback = async (event: Event) => {
      const customEvent = event as CustomEvent<{ url: string }>;
      const url = customEvent.detail?.url;
      
      if (!url) {
        console.warn('[AuthDeepLink] Received oauth-callback event but URL is empty');
        return;
      }

      console.log('[AuthDeepLink] ✅ Processing OAuth callback:', url);

      // Handle OAuth callback URLs:
      // - athletespace://auth/callback (custom URL scheme)
      // - capacitor://localhost/auth/callback (legacy)
      if (url.includes("/auth/callback") || url.includes("auth/callback")) {
        console.log('[AuthDeepLink] OAuth callback detected');
        
        // Close the in-app browser if it's open
        try {
          await Browser.close();
          console.log('[AuthDeepLink] In-app browser closed');
        } catch (error) {
          // Browser might not be open, ignore error
          console.log('[AuthDeepLink] Browser close skipped (not open or error):', error);
        }

        // Parse URL to extract tokens and check for errors
        try {
          const parsed = new URL(url);
          const error = parsed.searchParams.get("error");
          const success = parsed.searchParams.get("success");
          const accessToken = parsed.searchParams.get("access_token");
          const expiresIn = parsed.searchParams.get("expires_in");

          if (error) {
            console.error('[AuthDeepLink] OAuth error:', error);
            // Navigate to login with error
            window.location.hash = `/login?error=${encodeURIComponent(error)}`;
            return;
          }

          // If success=true, OAuth completed successfully
          if (success === "true") {
            console.log('[AuthDeepLink] OAuth success detected');
            
            // CRITICAL: For mobile, extract and store access token from URL
            // Backend includes access_token and expires_in in the redirect URL
            if (accessToken && expiresIn) {
              const expiresInSeconds = parseInt(expiresIn, 10);
              if (isNaN(expiresInSeconds) || expiresInSeconds <= 0) {
                console.error('[AuthDeepLink] Invalid expires_in value:', expiresIn);
                window.location.hash = `/login?error=invalid_token`;
                return;
              }
              
              console.log('[AuthDeepLink] Storing access token from OAuth callback');
              try {
                await storeAccessToken(accessToken, expiresInSeconds);
                console.log('[AuthDeepLink] ✅ Access token stored successfully');
              } catch (tokenError) {
                console.error('[AuthDeepLink] ❌ Failed to store access token:', tokenError);
                window.location.hash = `/login?error=token_storage_failed`;
                return;
              }
            } else {
              console.warn('[AuthDeepLink] OAuth success but no access_token in URL - this may fail for mobile');
            }
            
            // CRITICAL: Refresh auth state after storing token
            // This calls /me with the stored Bearer token
            console.log('[AuthDeepLink] Refreshing auth state after token storage');
            await refreshUser();
          }
        } catch (parseError) {
          console.warn('[AuthDeepLink] Failed to parse URL:', parseError);
          // If URL parsing fails, try to refresh anyway (might be a different URL format)
          if (url.includes("success=true")) {
            await refreshUser();
          }
        }

        // Navigate to home using hash router
        // AuthContext should now have updated auth state from refreshUser()
        window.location.hash = "/";
        
        // Call optional callback if provided
        if (onDeepLink) {
          onDeepLink();
        }
      }
    };

    window.addEventListener('oauth-callback', handleOAuthCallback);

    return () => {
      window.removeEventListener('oauth-callback', handleOAuthCallback);
    };
  }, [onDeepLink, refreshUser]);
}
