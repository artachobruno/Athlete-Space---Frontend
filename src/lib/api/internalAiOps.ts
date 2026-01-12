export interface DecisionAnalytics {
  intentDistribution: Record<string, number>;
  confidenceAvg: number;
  outcomes: Record<string, number>;
}

export interface PlanningFunnelStats {
  requested: number;
  validated: number;
  planned: number;
  executed: number;
  failed: number;
}

export interface ComplianceStats {
  executedPct: number;
  missedReasons: Record<string, number>;
  trend7d: number[];
}

export interface SafetyStats {
  loadRiskPct: number;
  recoveryAlignedPct: number;
  summary: string;
}

export interface RagStats {
  usagePct: number;
  avgConfidence: number;
  fallbackRate: number;
  safetyBlocks: number;
}

export interface ConversationStats {
  avgTurns: number;
  summariesPerConversation: number;
  compressionRatio: number;
}

export interface AuditStats {
  tracedPct: number;
  confirmedWritesPct: number;
  auditedToolsPct: number;
}

export interface AiOpsSummary {
  decision: DecisionAnalytics;
  funnel: PlanningFunnelStats;
  compliance: ComplianceStats;
  safety: SafetyStats;
  rag: RagStats;
  conversation: ConversationStats;
  audit: AuditStats;
}
