import { useEffect } from "react";
import { App } from "@capacitor/app";
import { isNative } from "@/lib/platform";
import { auth } from "@/lib/auth";

export function useAuthDeepLink(onToken: (t: string) => void) {
  useEffect(() => {
    if (!isNative) return;

    const sub = App.addListener("appUrlOpen", ({ url }) => {
      if (!url) return;

      // capacitor://localhost/auth/callback?token=XYZ
      if (url.includes("/auth/callback")) {
        const parsed = new URL(url);
        const token = parsed.searchParams.get("token");

        if (token) {
          auth.setToken(token);
          onToken(token);
          // Navigate to home using hash router
          window.location.hash = "/";
        }
      }
    });

    return () => {
      sub.then((h) => h.remove());
    };
  }, [onToken]);
}
