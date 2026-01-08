import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Activity, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { triggerHistoricalSync } from "@/lib/api";
import { Logo } from "@/components/Logo";

type SyncStatus = "idle" | "syncing" | "done" | "error";

export default function ConnectSuccess() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [hasRefreshed, setHasRefreshed] = useState(false);
  
  // Track if we've already started syncing to prevent redirect loops
  const syncStartedRef = useRef(false);

  // Refresh user to get latest strava_connected / onboarding_complete FIRST
  // This is critical - we need fresh user data after OAuth callback
  useEffect(() => {
    if (!hasRefreshed) {
      refreshUser()
        .then(() => {
          setHasRefreshed(true);
        })
        .catch((err) => {
          console.error("[ConnectSuccess] Failed to refresh user:", err);
          setHasRefreshed(true); // Still continue even if refresh fails
        });
    }
  }, [hasRefreshed, refreshUser]);

  // Auto-redirect to dashboard if onboarding is complete (don't wait for user to click Continue)
  useEffect(() => {
    // Wait for auth to load AND user to be refreshed
    if (authLoading || !hasRefreshed) return;

    // If no user at all, send to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // CRITICAL: If onboarding is complete, go directly to dashboard
    // This prevents users from being sent back to onboarding
    if (user.onboarding_complete) {
      console.log("[ConnectSuccess] Onboarding complete, redirecting to dashboard");
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [authLoading, user, navigate, hasRefreshed]);

  // Kick off sync once we have refreshed user data (only if onboarding not complete)
  useEffect(() => {
    // Wait for auth to load AND user to be refreshed
    if (authLoading || !hasRefreshed) return;

    // If no user at all, skip sync
    if (!user) return;

    // If onboarding is complete, skip sync (we're redirecting to dashboard)
    if (user.onboarding_complete) return;

    // If we've already started sync, don't start again
    if (syncStartedRef.current) return;

    // Start syncing - the triggerHistoricalSync will handle the case where Strava isn't connected
    if (syncStatus === "idle") {
      syncStartedRef.current = true;
      setSyncStatus("syncing");
      setSyncMessage("Importing your activities from Strava…");

      triggerHistoricalSync()
        .then((res) => {
          setSyncStatus("done");
          setSyncMessage(res.message || "Activities synced successfully!");
        })
        .catch((err) => {
          console.error("[ConnectSuccess] Sync error:", err);
          // Even on error, allow user to continue (sync can finish in background)
          setSyncStatus("done");
          setSyncMessage("We'll continue syncing in the background.");
        });
    }
  }, [authLoading, user, syncStatus, navigate, hasRefreshed]);

  const handleContinue = async () => {
    // Refresh user to get latest onboarding_complete status before redirecting
    // This ensures we have the most up-to-date data
    try {
      await refreshUser();
    } catch (err) {
      console.error("[ConnectSuccess] Failed to refresh user in handleContinue:", err);
    }

    // Get fresh user data after refresh
    // Note: refreshUser updates the context, but we need to wait for it to propagate
    // For now, check the current user state - the auto-redirect useEffect should catch it if stale
    // Always go to dashboard if onboarding is complete
    if (user?.onboarding_complete) {
      console.log("[ConnectSuccess] handleContinue: Onboarding complete, going to dashboard");
      navigate("/dashboard", { replace: true });
    } else {
      console.log("[ConnectSuccess] handleContinue: Onboarding not complete, going to onboarding");
      navigate("/onboarding", { replace: true });
    }
  };

  const isSyncing = syncStatus === "syncing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center">
        <Logo className="h-8 w-auto" />
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardContent className="pt-8 pb-6 text-center space-y-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-8 w-8 text-primary" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-primary">
                Strava Connected!
              </h1>
              <p className="text-muted-foreground">
                Your account is now linked.
              </p>
            </div>

            {/* Sync status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              {isSyncing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-muted-foreground">{syncMessage}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-foreground">{syncMessage}</span>
                </>
              )}
            </div>

            {/* CTA */}
            <Button
              size="lg"
              className="w-full"
              onClick={handleContinue}
              disabled={isSyncing}
            >
              {isSyncing ? (
                "Syncing…"
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground">
              {user?.onboarding_complete
                ? "You'll be taken to your dashboard."
                : "Next, we'll set up your training profile."}
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AthleteSpace
      </footer>
    </div>
  );
}
