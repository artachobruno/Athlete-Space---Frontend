import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { DecisionAnalytics } from "@/components/admin/DecisionAnalytics";
import { PlanningFunnel } from "@/components/admin/PlanningFunnel";
import { ComplianceOverview } from "@/components/admin/ComplianceOverview";
import { LoadRecoveryPanel } from "@/components/admin/LoadRecoveryPanel";
import { RagHealthPanel } from "@/components/admin/RagHealthPanel";
import { ConversationHealthPanel } from "@/components/admin/ConversationHealthPanel";
import { AuditSummary } from "@/components/admin/AuditSummary";
import { mockAiAdminData } from "@/mock/aiAdmin.mock";
import { useAiOpsSummary } from "@/hooks/useAiOpsSummary";
import type { AiOpsSummary } from "@/lib/api/internalAiOps";
import type { AiAdminData } from "@/mock/aiAdmin.mock";

// Helper to safely get a number from a Record
function getRecordValue(record: Record<string, number> | null | undefined, key: string): number {
  try {
    if (!record || typeof record !== 'object' || record === null) return 0;
    if (!(key in record)) return 0;
    const value = record[key];
    return typeof value === 'number' && !isNaN(value) ? value : 0;
  } catch {
    return 0;
  }
}

function mapBackendToComponent(backendData: AiOpsSummary | null | undefined): AiAdminData {
  // Guard against null/undefined
  if (!backendData) {
    return mockAiAdminData;
  }

  // Map intentDistribution from Record to specific keys
  const intentDist = backendData.decision?.intentDistribution;
  const intentDistribution = {
    plan: getRecordValue(intentDist, 'plan'),
    modify: getRecordValue(intentDist, 'modify'),
    explain: getRecordValue(intentDist, 'explain'),
    upload: getRecordValue(intentDist, 'upload'),
  };

  // Convert confidenceAvg to distribution buckets
  // Since backend only provides average, we estimate distribution
  const confidenceAvg = backendData.decision?.confidenceAvg ?? 0;
  let confidence: { high: number; medium: number; low: number };
  if (confidenceAvg >= 0.7) {
    // High average: most decisions are high confidence
    confidence = {
      high: Math.round(confidenceAvg * 100),
      medium: Math.round((1 - confidenceAvg) * 50),
      low: Math.round((1 - confidenceAvg) * 50),
    };
  } else if (confidenceAvg >= 0.4) {
    // Medium average: most decisions are medium confidence
    confidence = {
      high: Math.round((confidenceAvg - 0.4) * 100),
      medium: Math.round(confidenceAvg * 100),
      low: Math.round((1 - confidenceAvg) * 100),
    };
  } else {
    // Low average: most decisions are low confidence
    confidence = {
      high: 0,
      medium: Math.round(confidenceAvg * 50),
      low: Math.round(confidenceAvg * 100),
    };
  }
  // Normalize to ensure they sum to approximately 100
  const total = confidence.high + confidence.medium + confidence.low;
  if (total > 0) {
    confidence = {
      high: Math.round((confidence.high / total) * 100),
      medium: Math.round((confidence.medium / total) * 100),
      low: Math.round((confidence.low / total) * 100),
    };
  }

  // Map outcomes from Record to specific keys
  const outcomesDist = backendData.decision?.outcomes;
  const outcomes = {
    applied: getRecordValue(outcomesDist, 'applied'),
    blocked: getRecordValue(outcomesDist, 'blocked'),
    escalated: getRecordValue(outcomesDist, 'escalated'),
  };

  // Map funnel from backend structure to component structure
  // Convert counts to percentages relative to requested (base = 100%)
  const funnelData = backendData.funnel;
  const requested = funnelData?.requested ?? 0;
  const validated = funnelData?.validated ?? 0;
  const planned = funnelData?.planned ?? 0;
  const executed = funnelData?.executed ?? 0;
  const failed = funnelData?.failed ?? 0;
  const base = requested || 1; // Avoid division by zero
  const funnel = {
    intent: 100, // Base is always 100%
    generated: Math.round((validated / base) * 100),
    confirmed: Math.round((planned / base) * 100),
    persisted: Math.round((executed / base) * 100),
    compliant: Math.round(((executed - failed) / base) * 100),
  };

  // Calculate trend from trend7d array
  const trend7d = backendData.compliance?.trend7d ?? [];
  let trend: "up" | "down" | "stable" = "stable";
  if (trend7d.length >= 2) {
    const first = trend7d[0] ?? 0;
    const last = trend7d[trend7d.length - 1] ?? 0;
    if (last > first + 2) trend = "up";
    else if (last < first - 2) trend = "down";
  }

  // Map missedReasons from Record to specific keys
  const missedReasonsDist = backendData.compliance?.missedReasons;
  const missedReasons = {
    fatigue: getRecordValue(missedReasonsDist, 'fatigue'),
    skipped: getRecordValue(missedReasonsDist, 'skipped'),
    conflict: getRecordValue(missedReasonsDist, 'conflict'),
  };

  // Convert loadRiskPct to 'safe' | 'watch' | 'high'
  const loadRiskPct = backendData.safety?.loadRiskPct ?? 0;
  const loadRisk: "safe" | "watch" | "high" =
    loadRiskPct < 30 ? "safe" : loadRiskPct < 70 ? "watch" : "high";

  // Convert recoveryAlignedPct to boolean
  const recoveryAligned = (backendData.safety?.recoveryAlignedPct ?? 0) >= 50;

  return {
    intentDistribution,
    confidence,
    outcomes,
    funnel,
    compliance: {
      executedPct: backendData.compliance?.executedPct ?? 0,
      missedReasons,
      trend,
    },
    safety: {
      loadRisk,
      recoveryAligned,
      summary: backendData.safety?.summary ?? "",
    },
    rag: {
      usagePct: backendData.rag?.usagePct ?? 0,
      avgConfidence: backendData.rag?.avgConfidence ?? 0,
      fallbackRate: backendData.rag?.fallbackRate ?? 0,
      safetyBlocks: backendData.rag?.safetyBlocks ?? 0,
    },
    conversation: {
      avgTurns: backendData.conversation?.avgTurns ?? 0,
      summariesPerConv: backendData.conversation?.summariesPerConversation ?? 0,
      compressionRatio: backendData.conversation?.compressionRatio ?? 0,
    },
    audit: {
      tracedPct: backendData.audit?.tracedPct ?? 0,
      confirmedWritesPct: backendData.audit?.confirmedWritesPct ?? 0,
      auditedToolsPct: backendData.audit?.auditedToolsPct ?? 0,
    },
  };
}

export default function AiDashboard() {
  // Preview safety: always use mock data
  // In production, this would fetch from API
  const isPreview =
    typeof window !== "undefined" &&
    window.location.hostname.includes("lovable");

  const { data: backendData, isLoading, error } = useAiOpsSummary(!isPreview);

  // Always ensure data is defined - use mock as fallback
  let data: AiAdminData;
  if (isPreview) {
    data = mockAiAdminData;
  } else {
    try {
      data = mapBackendToComponent(backendData ?? null);
    } catch (err) {
      console.error('[AiDashboard] Error mapping backend data:', err);
      data = mockAiAdminData;
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI System Dashboard</h1>
            <p className="text-muted-foreground">
              Decision quality, safety, and behavioral health
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            Internal · Read-only
          </Badge>
        </div>

        {!isPreview && isLoading && (
          <p className="text-sm text-muted-foreground">
            Loading AI system metrics…
          </p>
        )}

        {!isPreview && error && (
          <p className="text-sm text-destructive">
            AI metrics unavailable
          </p>
        )}

        {/* Decision Analytics */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Decision Analytics</h2>
          <DecisionAnalytics
            intentDistribution={data.intentDistribution}
            confidence={data.confidence}
            outcomes={data.outcomes}
          />
        </section>

        {/* Planning & Compliance Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold mb-4">Planning Funnel</h2>
            <PlanningFunnel funnel={data.funnel} />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Calendar Compliance</h2>
            <ComplianceOverview
              executedPct={data.compliance.executedPct}
              missedReasons={data.compliance.missedReasons}
              trend={data.compliance.trend}
            />
          </section>
        </div>

        {/* Safety & RAG Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold mb-4">Load & Recovery Safety</h2>
            <LoadRecoveryPanel
              loadRisk={data.safety.loadRisk}
              recoveryAligned={data.safety.recoveryAligned}
              summary={data.safety.summary}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">RAG Performance</h2>
            <RagHealthPanel
              usagePct={data.rag.usagePct}
              avgConfidence={data.rag.avgConfidence}
              fallbackRate={data.rag.fallbackRate}
              safetyBlocks={data.rag.safetyBlocks}
            />
          </section>
        </div>

        {/* Conversation & Audit Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <h2 className="text-lg font-semibold mb-4">Conversation Health</h2>
            <ConversationHealthPanel
              avgTurns={data.conversation.avgTurns}
              summariesPerConv={data.conversation.summariesPerConv}
              compressionRatio={data.conversation.compressionRatio}
            />
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-4">Audit & Traceability</h2>
            <AuditSummary
              tracedPct={data.audit.tracedPct}
              confirmedWritesPct={data.audit.confirmedWritesPct}
              auditedToolsPct={data.audit.auditedToolsPct}
            />
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
