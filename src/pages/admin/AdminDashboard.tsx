import { AppLayout } from '@/components/layout/AppLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { LatencyChart } from '@/components/admin/LatencyChart';
import { SlaBar } from '@/components/admin/SlaBar';
import { ServiceHealthList } from '@/components/admin/ServiceHealthList';
import { TrafficChart } from '@/components/admin/TrafficChart';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

/**
 * Mock ops data for preview mode
 * This will be replaced with real API data later
 */
const mockOpsData = {
  apiHealth: 'healthy' as const,
  mcpStatus: 'online' as const,
  uptime: 99.96,
  errorRate: 0.3,
  latency: {
    p50: 180,
    p95: 420,
    p99: 780,
  },
  latencyHistory: [
    { time: '00:00', p50: 165, p95: 380, p99: 720 },
    { time: '02:00', p50: 155, p95: 360, p99: 690 },
    { time: '04:00', p50: 140, p95: 320, p99: 640 },
    { time: '06:00', p50: 160, p95: 400, p99: 750 },
    { time: '08:00', p50: 195, p95: 480, p99: 820 },
    { time: '10:00', p50: 210, p95: 520, p99: 890 },
    { time: '12:00', p50: 200, p95: 490, p99: 850 },
    { time: '14:00', p50: 185, p95: 450, p99: 800 },
    { time: '16:00', p50: 190, p95: 460, p99: 810 },
    { time: '18:00', p50: 205, p95: 500, p99: 860 },
    { time: '20:00', p50: 180, p95: 420, p99: 780 },
    { time: '22:00', p50: 170, p95: 400, p99: 750 },
  ],
  sla: 99.8,
  slaThreshold: 99.5,
  services: [
    { name: 'Orchestrator', p95: 410, status: 'ok' as const },
    { name: 'MCP DB', p95: 390, status: 'ok' as const },
    { name: 'MCP FS', p95: 460, status: 'warn' as const },
  ],
  reliabilitySignals: [
    { type: 'success' as const, message: 'No incident in last 7 days' },
    { type: 'info' as const, message: 'Elevated latency during peak hours' },
    { type: 'warning' as const, message: 'One retry spike detected' },
  ],
  traffic: {
    activeUsers15m: 12,
    activeUsers24h: 87,
    concurrentSessions: 9,
    requestsPerMinute: 46,
    executorRunsPerMinute: 6.2,
    planBuildsPerHour: 14,
    toolCallsPerMinute: 28,
    requestVolumeHistory: [
      { time: '10:00', rpm: 32 },
      { time: '10:10', rpm: 41 },
      { time: '10:20', rpm: 38 },
      { time: '10:30', rpm: 45 },
      { time: '10:40', rpm: 49 },
      { time: '10:50', rpm: 46 },
    ],
    activitySignals: [
      { type: 'success' as const, message: 'Normal planning volume' },
      { type: 'info' as const, message: 'Peak activity detected 09:00–10:00' },
      { type: 'warning' as const, message: 'Plan failures elevated for 6 minutes' },
    ],
  },
};

/**
 * Internal Admin Dashboard
 * Read-only ops dashboard for monitoring system health, latency, and reliability
 * Preview-safe: renders with mock data, no auth required
 */
export default function AdminDashboard() {
  const isPreview = typeof window !== 'undefined' && window.location.hostname.includes('lovable');
  const data = isPreview ? mockOpsData : mockOpsData;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Internal Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              System health, latency, and reliability
            </p>
          </div>
          <Badge variant="outline" className="self-start sm:self-auto text-muted-foreground border-muted-foreground/30">
            Internal · Read-only
          </Badge>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard label="API" value="Healthy" status="healthy" />
          <AdminStatCard label="MCP" value="Online" subtext="DB / FS" status="healthy" />
          <AdminStatCard
            label="Error Rate"
            value={`${data.errorRate}%`}
            subtext="Last 24h"
            status={data.errorRate < 1 ? 'healthy' : data.errorRate < 5 ? 'warning' : 'critical'}
          />
          <AdminStatCard
            label="Uptime"
            value={`${data.uptime}%`}
            subtext="30 days"
            status={data.uptime >= 99.9 ? 'healthy' : data.uptime >= 99 ? 'warning' : 'critical'}
          />
        </div>

        {/* Traffic Overview */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Traffic Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard
              label="Active Users (15m)"
              value={String(data.traffic.activeUsers15m)}
              subtext="Last 15 minutes"
              status="healthy"
            />
            <AdminStatCard
              label="Active Users (24h)"
              value={String(data.traffic.activeUsers24h)}
              subtext="Last 24 hours"
              status="healthy"
            />
            <AdminStatCard
              label="Concurrent Sessions"
              value={String(data.traffic.concurrentSessions)}
              subtext="Right now"
              status="healthy"
            />
            <AdminStatCard
              label="Requests / Minute"
              value={String(data.traffic.requestsPerMinute)}
              subtext="Avg last 5 min"
              status="healthy"
            />
          </div>
        </div>

        {/* Request Volume Chart */}
        <TrafficChart data={data.traffic.requestVolumeHistory} />

        {/* Execution Activity */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Execution Activity</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AdminStatCard
              label="Executor Runs / Min"
              value={String(data.traffic.executorRunsPerMinute)}
              subtext="Avg last 10 min"
              status="healthy"
            />
            <AdminStatCard
              label="Plan Builds / Hour"
              value={String(data.traffic.planBuildsPerHour)}
              subtext="Last hour"
              status="healthy"
            />
            <AdminStatCard
              label="Tool Calls / Min"
              value={String(data.traffic.toolCallsPerMinute)}
              subtext="All MCP tools"
              status="healthy"
            />
          </div>
        </div>

        {/* Activity Signals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Activity Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.traffic.activitySignals.map((signal, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30"
              >
                {signal.type === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                )}
                {signal.type === 'warning' && (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                {signal.type === 'info' && (
                  <Info className="h-4 w-4 text-blue-500 shrink-0" />
                )}
                <span className="text-sm text-foreground">{signal.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Latency & SLA Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Latency & Reliability</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LatencyChart data={data.latencyHistory} currentMetrics={data.latency} />
            <div className="space-y-4">
              <SlaBar value={data.sla} threshold={data.slaThreshold} />
              <ServiceHealthList services={data.services} />
            </div>
          </div>
        </div>

        {/* Reliability Signals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Reliability Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.reliabilitySignals.map((signal, index) => (
              <div
                key={index}
                className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted/30"
              >
                {signal.type === 'success' && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                )}
                {signal.type === 'warning' && (
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                {signal.type === 'info' && (
                  <Info className="h-4 w-4 text-blue-500 shrink-0" />
                )}
                <span className="text-sm text-foreground">{signal.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
