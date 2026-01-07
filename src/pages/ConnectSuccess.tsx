import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Activity, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { triggerHistoricalSync } from "@/lib/api";
import logo from "@/assets/logo.png";

type SyncStatus = "idle" | "syncing" | "done" | "error";

export default function ConnectSuccess() {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUser } = useAuth();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Kick off sync once we have a user
  useEffect(() => {
    if (authLoading) return;

    // If no user at all, send to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // If Strava isn't connected, send to onboarding
    if (!user.strava_connected) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Start syncing
    if (syncStatus === "idle") {
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
  }, [authLoading, user, syncStatus, navigate]);

  // Refresh user to get latest strava_connected / onboarding_complete
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    if (user?.onboarding_complete) {
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/onboarding", { replace: true });
    }
  };

  const isSyncing = syncStatus === "syncing";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center gap-3">
        <div className="w-1.5 h-6 bg-primary rounded-sm" />
        <img src={logo} alt="AthleteSpace" className="h-8 w-auto dark:invert" />
        <span className="font-bold text-xl text-foreground">AthleteSpace</span>
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
              <h1 className="text-2xl font-bold text-foreground">
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
