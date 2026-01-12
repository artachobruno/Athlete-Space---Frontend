export type HealthStatus = 'ok' | 'warn' | 'critical';

export interface OpsSummary {
  api_health: HealthStatus;
  mcp_status: HealthStatus;
  uptime: number;
  error_rate: number;
  latency: {
    p50: number;
    p95: number;
    p99: number;
  };
  latency_history: {
    time: string;
    p50: number;
    p95: number;
    p99: number;
  }[];
  sla: number;
  sla_threshold: number;
  services: {
    name: string;
    p95_ms: number;
    status: HealthStatus;
  }[];
  traffic: {
    active_users_15m: number;
    active_users_24h: number;
    concurrent_sessions: number;
    requests_per_minute: number;
    executor_runs_per_minute: number;
    plan_builds_per_hour: number;
    tool_calls_per_minute: number;
    request_volume_history?: {
      time: string;
      rpm: number;
    }[];
  };
  reliability_signals?: {
    type: 'success' | 'info' | 'warning';
    message: string;
  }[];
  activity_signals?: {
    type: 'success' | 'info' | 'warning';
    message: string;
  }[];
}
