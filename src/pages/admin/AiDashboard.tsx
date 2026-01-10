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

export default function AiDashboard() {
  // Preview safety: always use mock data
  // In production, this would fetch from API
  const isPreview =
    typeof window !== "undefined" &&
    window.location.hostname.includes("lovable");

  const data = isPreview ? mockAiAdminData : mockAiAdminData; // Real API later

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
