import { AppLayout } from '@/components/layout/AppLayout';
import { AdminStatCard } from '@/components/admin/AdminStatCard';
import { LatencyChart } from '@/components/admin/LatencyChart';
import { SlaBar } from '@/components/admin/SlaBar';
import { ServiceHealthList } from '@/components/admin/ServiceHealthList';
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
  // Mock time-series data for the chart (last 24h, hourly)
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
};

/**
 * Internal Admin Dashboard
 * Read-only ops dashboard for monitoring system health, latency, and reliability
 * Preview-safe: renders with mock data, no auth required
 */
export default function AdminDashboard() {
  // In preview mode (or production without real API), use mock data
  // This pattern allows easy swap to real API later
  const isPreview = typeof window !== 'undefined' && window.location.hostname.includes('lovable');
  const data = isPreview ? mockOpsData : mockOpsData; // Real data integration later

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
          <AdminStatCard
            label="API"
            value="Healthy"
            status="healthy"
          />
          <AdminStatCard
            label="MCP"
            value="Online"
            subtext="DB / FS"
            status="healthy"
          />
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

        {/* Latency & SLA Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Latency & Reliability</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Latency Chart */}
            <LatencyChart 
              data={data.latencyHistory}
              currentMetrics={data.latency}
            />

            {/* SLA & Service Health */}
            <div className="space-y-4">
              {/* SLA Compliance */}
              <SlaBar 
                value={data.sla} 
                threshold={data.slaThreshold} 
              />

              {/* Service Breakdown */}
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
