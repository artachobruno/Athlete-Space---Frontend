import { useEffect } from "react";
import { App } from "@/lib/capacitor-stubs/app";
import { isNative } from "@/lib/platform";

/**
 * Hook to handle OAuth deep links in native apps.
 * NOTE: Backend should set HTTP-only cookies during OAuth callback.
 * This handler only navigates to home - AuthContext will check authentication via /me.
 */
export function useAuthDeepLink(onDeepLink?: () => void) {
  useEffect(() => {
    if (!isNative) return;

    const sub = App.addListener("appUrlOpen", ({ url }) => {
      if (!url) return;

      // capacitor://localhost/auth/callback
      // Backend should have set HTTP-only cookies during OAuth callback
      // Navigate to home - AuthContext will automatically check authentication via /me
      if (url.includes("/auth/callback")) {
        const parsed = new URL(url);
        const token = parsed.searchParams.get("token");

        // If token is in URL, log a warning (backend should set cookies instead)
        if (token) {
          console.warn('[AuthDeepLink] Token in URL detected - backend should set HTTP-only cookies instead');
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
