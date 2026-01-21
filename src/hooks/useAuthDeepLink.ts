import { useEffect } from "react";
import { App } from "@/lib/capacitor-stubs/app";
import { Browser } from "@/lib/capacitor-stubs/browser";
import { isNative } from "@/lib/platform";

/**
 * Hook to handle OAuth deep links in native apps.
 * 
 * When Google OAuth completes, the backend redirects to athletespace://auth/callback
 * This hook listens for that URL and:
 * 1. Closes the in-app browser (if open)
 * 2. Navigates to the home screen
 * 3. Triggers AuthContext to re-check authentication via /me
 * 
 * NOTE: Backend should set HTTP-only cookies during OAuth callback.
 */
export function useAuthDeepLink(onDeepLink?: () => void) {
  useEffect(() => {
    if (!isNative) return;

    const sub = App.addListener("appUrlOpen", async ({ url }) => {
      if (!url) return;

      console.log('[AuthDeepLink] Received deep link:', url);

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

        // Parse URL to check for any error or token
        try {
          const parsed = new URL(url);
          const error = parsed.searchParams.get("error");
          const token = parsed.searchParams.get("token");

          if (error) {
            console.error('[AuthDeepLink] OAuth error:', error);
            // Navigate to login with error
            window.location.hash = `/login?error=${encodeURIComponent(error)}`;
            return;
          }

          // If token is in URL, log a warning (backend should set cookies instead)
          if (token) {
            console.warn('[AuthDeepLink] Token in URL detected - backend should set HTTP-only cookies instead');
          }
        } catch (parseError) {
          console.warn('[AuthDeepLink] Failed to parse URL:', parseError);
        }

        // Navigate to home using hash router
        // AuthContext will automatically check authentication via /me endpoint
        window.location.hash = "/";
        
        // Call optional callback if provided
        if (onDeepLink) {
          onDeepLink();
        }
      }
    });

    return () => {
      sub.then((h) => h.remove()).catch(() => {
        // Ignore errors during cleanup (stub implementation)
      });
    };
  }, [onDeepLink]);
}
