// Plan Inspector (Dev-Only)
// Diagnostic view for plan intent, phase logic, weekly structure, coach reasoning, and modifications

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { AppLayout } from "@/components/layout/AppLayout";
import { getPlanInspect, type PlanInspectResponse } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { isPreviewMode } from "@/lib/preview";

export default function PlanInspect() {
  const { user, status, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PlanInspectResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Dev-only access: allow in preview mode or development
  const isDev = isPreviewMode() || import.meta.env.DEV;

  useEffect(() => {
    if (status === "bootstrapping" || loading) {
      return;
    }

    if (status === "unauthenticated") {
      navigate("/login", { replace: true });
      return;
    }

    if (status === "authenticated" && user && !user.onboarding_complete) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Load plan inspection data
    const loadData = async () => {
      try {
        setLoadingData(true);
        const response = await getPlanInspect();
        setData(response);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load plan inspection data";
        setError(errorMessage);
        console.error("Plan inspect error:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (status === "authenticated") {
      loadData();
    }
  }, [status, loading, user, navigate]);

  if (status === "bootstrapping" || loading || loadingData) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">PLAN INSPECTOR (DEV)</h1>
          <p>Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">PLAN INSPECTOR (DEV)</h1>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800 font-semibold">Error: {error}</p>
            <p className="text-red-600 text-sm mt-2">
              {error.includes("403") || error.includes("Forbidden")
                ? "Access denied. This page is restricted to admin/dev users only."
                : "Failed to load plan inspection data."}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-2xl font-bold mb-4">PLAN INSPECTOR (DEV)</h1>
          <p>No data available.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">PLAN INSPECTOR (DEV)</h1>
          <p className="text-sm text-muted-foreground">Diagnostic view for plan debugging</p>
        </div>

        {/* PLAN SNAPSHOT */}
        <section>
          <h2 className="text-xl font-semibold mb-3 border-b pb-2">PLAN SNAPSHOT</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
            <div><strong>Objective:</strong> {data.plan_snapshot.objective}</div>
            <div><strong>Anchor Type:</strong> {data.plan_snapshot.anchor_type}</div>
            <div><strong>Anchor Title:</strong> {data.plan_snapshot.anchor_title}</div>
            {data.plan_snapshot.anchor_date && (
              <div><strong>Anchor Date:</strong> {format(new Date(data.plan_snapshot.anchor_date), "yyyy-MM-dd")}</div>
            )}
            {data.plan_snapshot.current_phase && (
              <div><strong>Current Phase:</strong> {data.plan_snapshot.current_phase}</div>
            )}
            <div><strong>Total Weeks:</strong> {data.plan_snapshot.total_weeks}</div>
            {Object.keys(data.plan_snapshot.weekly_structure).length > 0 && (
              <div className="mt-2">
                <strong>Weekly Structure:</strong>
                <ul className="list-disc list-inside ml-4">
                  {Object.entries(data.plan_snapshot.weekly_structure).map(([day, activity]) => (
                    <li key={day}>{day}: {activity}</li>
                  ))}
                </ul>
              </div>
            )}
          </pre>
        </section>

        {/* PHASES */}
        <section>
          <h2 className="text-xl font-semibold mb-3 border-b pb-2">PHASES</h2>
          {data.phases.map((phase, phaseIdx) => (
            <div key={phaseIdx} className="mb-6 border-l-2 border-gray-300 pl-4">
              <h3 className="font-semibold text-lg mb-2">{phase.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{phase.intent}</p>
              {phase.weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="mb-4 ml-4">
                  <div className="font-mono text-sm">
                    <div>
                      <strong>WEEK {week.week_index}</strong> — {format(new Date(week.date_range[0]), "MMM d")}–{format(new Date(week.date_range[1]), "MMM d")} ({week.status})
                    </div>
                    <div className="mt-1"><strong>Focus:</strong> {week.intended_focus}</div>
                    {week.planned_key_sessions.length > 0 && (
                      <div className="mt-1">
                        <strong>Key Sessions:</strong>
                        <ul className="list-disc list-inside ml-4">
                          {week.planned_key_sessions.map((session, idx) => (
                            <li key={idx}>{session}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {week.modifications.length > 0 && (
                      <div className="mt-2">
                        <strong>Modifications:</strong>
                        {week.modifications.map((mod, modIdx) => (
                          <div key={modIdx} className="ml-4 mt-1">
                            <div>• {mod.type}: {mod.delta}</div>
                            <div className="ml-4 text-xs text-muted-foreground">
                              Reason: {mod.reason}
                            </div>
                            <div className="ml-4 text-xs text-muted-foreground">
                              Trigger: {mod.trigger}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* COACH ASSESSMENT */}
        {data.coach_assessment && (
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">COACH ASSESSMENT</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm whitespace-pre-wrap">
              {data.coach_assessment.summary}
            </pre>
            <div className="mt-2 text-sm">
              <strong>Confidence:</strong> {data.coach_assessment.confidence}
            </div>
          </section>
        )}

        {/* PLAN CHANGE LOG */}
        {data.change_log.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-3 border-b pb-2">PLAN CHANGE LOG</h2>
            <ul className="space-y-2">
              {data.change_log.map((item, idx) => (
                <li key={idx} className="font-mono text-sm">
                  {format(new Date(item.date), "MMM d")} — {item.change_type}: {item.description}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppLayout>
  );
}
