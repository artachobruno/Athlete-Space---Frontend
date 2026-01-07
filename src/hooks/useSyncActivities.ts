import { useEffect } from "react";
import { checkRecentActivities } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to automatically check for recent activities.
 *
 * IMPORTANT: Only run when we have a confirmed authenticated user *and* Strava is connected.
 * This prevents accidental 401s on fresh OAuth callbacks (which can clear the token and bounce the user).
 */
export function useSyncActivities() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!user.strava_connected) return;

    checkRecentActivities().catch((error) => {
      // Best-effort background sync check.
      if (import.meta.env.DEV) {
        console.log("[Sync] Activity check failed:", error);
      }
    });
  }, [loading, user]);
}

