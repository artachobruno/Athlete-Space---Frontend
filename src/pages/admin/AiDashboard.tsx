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

function mapBackendToComponent(backendData: AiOpsSummary): AiAdminData {
  // Map intentDistribution from Record to specific keys
  const intentDist = backendData.decision.intentDistribution;
  const intentDistribution = {
    plan: intentDist.plan ?? intentDist["plan"] ?? 0,
    modify: intentDist.modify ?? intentDist["modify"] ?? 0,
    explain: intentDist.explain ?? intentDist["explain"] ?? 0,
    upload: intentDist.upload ?? intentDist["upload"] ?? 0,
  };

  // Convert confidenceAvg to distribution buckets
  // Since backend only provides average, we estimate distribution
  const confidenceAvg = backendData.decision.confidenceAvg;
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
  const outcomesDist = backendData.decision.outcomes;
  const outcomes = {
    applied: outcomesDist.applied ?? outcomesDist["applied"] ?? 0,
    blocked: outcomesDist.blocked ?? outcomesDist["blocked"] ?? 0,
    escalated: outcomesDist.escalated ?? outcomesDist["escalated"] ?? 0,
  };

  // Map funnel from backend structure to component structure
  // Convert counts to percentages relative to requested (base = 100%)
  const base = backendData.funnel.requested || 1; // Avoid division by zero
  const funnel = {
    intent: 100, // Base is always 100%
    generated: Math.round((backendData.funnel.validated / base) * 100),
    confirmed: Math.round((backendData.funnel.planned / base) * 100),
    persisted: Math.round((backendData.funnel.executed / base) * 100),
    compliant: Math.round(((backendData.funnel.executed - backendData.funnel.failed) / base) * 100),
  };

  // Calculate trend from trend7d array
  const trend7d = backendData.compliance.trend7d;
  let trend: "up" | "down" | "stable" = "stable";
  if (trend7d.length >= 2) {
    const first = trend7d[0] ?? 0;
    const last = trend7d[trend7d.length - 1] ?? 0;
    if (last > first + 2) trend = "up";
    else if (last < first - 2) trend = "down";
  }

  // Map missedReasons from Record to specific keys
  const missedReasonsDist = backendData.compliance.missedReasons;
  const missedReasons = {
    fatigue: missedReasonsDist.fatigue ?? missedReasonsDist["fatigue"] ?? 0,
    skipped: missedReasonsDist.skipped ?? missedReasonsDist["skipped"] ?? 0,
    conflict: missedReasonsDist.conflict ?? missedReasonsDist["conflict"] ?? 0,
  };

  // Convert loadRiskPct to 'safe' | 'watch' | 'high'
  const loadRiskPct = backendData.safety.loadRiskPct;
  const loadRisk: "safe" | "watch" | "high" =
    loadRiskPct < 30 ? "safe" : loadRiskPct < 70 ? "watch" : "high";

  // Convert recoveryAlignedPct to boolean
  const recoveryAligned = backendData.safety.recoveryAlignedPct >= 50;

  return {
    intentDistribution,
    confidence,
    outcomes,
    funnel,
    compliance: {
      executedPct: backendData.compliance.executedPct,
      missedReasons,
      trend,
    },
    safety: {
      loadRisk,
      recoveryAligned,
      summary: backendData.safety.summary,
    },
    rag: {
      usagePct: backendData.rag.usagePct,
      avgConfidence: backendData.rag.avgConfidence,
      fallbackRate: backendData.rag.fallbackRate,
      safetyBlocks: backendData.rag.safetyBlocks,
    },
    conversation: {
      avgTurns: backendData.conversation.avgTurns,
      summariesPerConv: backendData.conversation.summariesPerConversation,
      compressionRatio: backendData.conversation.compressionRatio,
    },
    audit: {
      tracedPct: backendData.audit.tracedPct,
      confirmedWritesPct: backendData.audit.confirmedWritesPct,
      auditedToolsPct: backendData.audit.auditedToolsPct,
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

  const data = isPreview
    ? mockAiAdminData
    : backendData
      ? mapBackendToComponent(backendData)
      : mockAiAdminData;

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
