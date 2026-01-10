/**
 * Mock data for AI Admin Dashboard
 * Used in preview mode and for development
 */

export interface AiAdminData {
  intentDistribution: {
    plan: number;
    modify: number;
    explain: number;
    upload: number;
  };
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
  outcomes: {
    applied: number;
    blocked: number;
    escalated: number;
  };
  funnel: {
    intent: number;
    generated: number;
    confirmed: number;
    persisted: number;
    compliant: number;
  };
  compliance: {
    executedPct: number;
    missedReasons: {
      fatigue: number;
      skipped: number;
      conflict: number;
    };
    trend: 'up' | 'down' | 'stable';
  };
  safety: {
    loadRisk: 'safe' | 'watch' | 'high';
    recoveryAligned: boolean;
    summary: string;
  };
  rag: {
    usagePct: number;
    avgConfidence: number;
    fallbackRate: number;
    safetyBlocks: number;
  };
  conversation: {
    avgTurns: number;
    summariesPerConv: number;
    compressionRatio: number;
  };
  audit: {
    tracedPct: number;
    confirmedWritesPct: number;
    auditedToolsPct: number;
  };
}

export const mockAiAdminData: AiAdminData = {
  intentDistribution: {
    plan: 42,
    modify: 28,
    explain: 18,
    upload: 12,
  },
  confidence: {
    high: 68,
    medium: 24,
    low: 8,
  },
  outcomes: {
    applied: 72,
    blocked: 18,
    escalated: 10,
  },
  funnel: {
    intent: 100,
    generated: 92,
    confirmed: 78,
    persisted: 74,
    compliant: 69,
  },
  compliance: {
    executedPct: 81,
    missedReasons: {
      fatigue: 9,
      skipped: 6,
      conflict: 4,
    },
    trend: 'up',
  },
  safety: {
    loadRisk: 'safe',
    recoveryAligned: true,
    summary: 'Load progression within safe bounds. Recovery metrics aligned with training stress.',
  },
  rag: {
    usagePct: 64,
    avgConfidence: 0.82,
    fallbackRate: 6,
    safetyBlocks: 2,
  },
  conversation: {
    avgTurns: 6.2,
    summariesPerConv: 1.3,
    compressionRatio: 0.41,
  },
  audit: {
    tracedPct: 100,
    confirmedWritesPct: 100,
    auditedToolsPct: 100,
  },
};
