import { useEffect } from "react";
import { Browser } from "@/lib/capacitor-stubs/browser";
import { isNative } from "@/lib/platform";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to handle OAuth deep links in native apps.
 * 
 * CRITICAL: The deep link listener is registered at module load time (registerDeepLinks.ts)
 * to ensure it exists before iOS delivers deep links after OAuth. This hook listens for
 * the custom 'oauth-callback' event dispatched by the top-level listener.
 * 
 * When Google OAuth completes, the backend redirects to athletespace://auth/callback
 * This hook handles that URL and:
 * 1. Closes the in-app browser (if open)
 * 2. Explicitly triggers AuthContext to re-check authentication via /me
 * 3. Navigates to the home screen
 * 
 * CRITICAL: For mobile OAuth with external browser (Browser.open()), cookies set in Safari
 * may not be immediately available in the WebView. We explicitly call refreshUser() to
 * ensure AuthContext checks authentication via /me endpoint, which will work if the
 * backend properly set the cookie with correct domain/path settings.
 * 
 * NOTE: Backend should set HTTP-only cookies during OAuth callback with:
 * - domain: backend domain (for cross-origin cookies)
 * - samesite: "none" (required for cross-origin)
 * - secure: true (HTTPS only)
 * - path: "/" (required for WKWebView)
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

        // Parse URL to check for any error
        try {
          const parsed = new URL(url);
          const error = parsed.searchParams.get("error");
          const success = parsed.searchParams.get("success");

          if (error) {
            console.error('[AuthDeepLink] OAuth error:', error);
            // Navigate to login with error
            window.location.hash = `/login?error=${encodeURIComponent(error)}`;
            return;
          }

          // If success=true, OAuth completed successfully
          if (success === "true") {
            console.log('[AuthDeepLink] OAuth success detected, refreshing auth state');
            // CRITICAL: Explicitly refresh auth to check /me endpoint
            // This ensures AuthContext picks up the cookie set by backend
            await refreshUser();
          }
        } catch (parseError) {
          console.warn('[AuthDeepLink] Failed to parse URL:', parseError);
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
