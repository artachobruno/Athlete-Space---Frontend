import { useEffect } from "react";
import { App } from "@/lib/capacitor-stubs/app";
import { isNative } from "@/lib/platform";

/**
 * Hook to handle OAuth deep links in native apps.
 * Note: Backend should set HTTP-only cookies instead of returning tokens in URL.
 * This handler is kept for compatibility but tokens in URLs are deprecated.
 */
export function useAuthDeepLink(onToken: (t: string) => void) {
  useEffect(() => {
    if (!isNative) return;

    const sub = App.addListener("appUrlOpen", ({ url }) => {
      if (!url) return;

      // capacitor://localhost/auth/callback?token=XYZ
      // NOTE: Legacy flow - backend should set cookies instead
      if (url.includes("/auth/callback")) {
        const parsed = new URL(url);
        const token = parsed.searchParams.get("token");

        if (token) {
          console.warn('[AuthDeepLink] Token in URL detected - backend should set HTTP-only cookies instead');
          // CRITICAL: Do NOT use token from URL for authentication
          // /me endpoint is the ONLY source of truth for authentication
          // Backend should have set HTTP-only cookies during OAuth callback
          // If cookies are not set, /me will fail and user will be logged out (correct behavior)
          // We call onToken callback for logging/cleanup, but do NOT use it for auth
          onToken(token);
          // Navigate to home using hash router
          window.location.hash = "/";
        }
      }
    });

    return () => {
      sub.then((h) => h.remove()).catch(() => {
        // Ignore errors during cleanup (stub implementation)
      });
    };
  }, [onToken]);
}
