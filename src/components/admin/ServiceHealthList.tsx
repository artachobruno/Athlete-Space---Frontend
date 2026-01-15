import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  name: string;
  p95: number;
  status: 'ok' | 'warn' | 'critical';
}

interface ServiceHealthListProps {
  services: Service[];
}

/**
 * Service health breakdown table
 * Shows each service's p95 latency and status
 */
export function ServiceHealthList({ services }: ServiceHealthListProps) {
  return (
    <GlassCard>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Service Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Header row */}
          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground py-2 border-b border-border">
            <span>Service</span>
            <span className="text-right">p95 Latency</span>
            <span className="text-right">Status</span>
          </div>

          {/* Service rows */}
          {services.map((service) => (
            <div 
              key={service.name}
              className="grid grid-cols-3 gap-4 py-2.5 text-sm"
            >
              <span className="font-medium text-foreground">{service.name}</span>
              <span className={cn(
                'text-right',
                service.p95 > 450 ? 'text-amber-500' : 'text-muted-foreground'
              )}>
                {service.p95}ms
              </span>
              <div className="flex items-center justify-end">
                {service.status === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : service.status === 'warn' ? (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </GlassCard>
  );
}
