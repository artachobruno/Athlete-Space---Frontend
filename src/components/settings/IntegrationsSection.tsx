import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Link2, Check, X, Clock, ExternalLink,
  Activity, Watch, Heart, Apple, BarChart3
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  status: 'connected' | 'disconnected' | 'coming-soon';
  primary?: boolean;
  lastSync?: string;
}

const integrations: Integration[] = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Sync activities, import training history, and track your progress',
    icon: Activity,
    iconColor: 'text-[#FC4C02]',
    status: 'connected',
    primary: true,
    lastSync: '2 hours ago',
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    description: 'Import workouts and physiological metrics from Garmin devices',
    icon: Watch,
    iconColor: 'text-[#007CC3]',
    status: 'disconnected',
  },
  {
    id: 'whoop',
    name: 'WHOOP',
    description: 'Recovery, strain, and sleep data for adaptive training',
    icon: Heart,
    iconColor: 'text-[#00A86B]',
    status: 'coming-soon',
  },
  {
    id: 'apple-health',
    name: 'Apple Health',
    description: 'Heart rate, HRV, and activity data from Apple Watch',
    icon: Apple,
    iconColor: 'text-foreground',
    status: 'coming-soon',
  },
  {
    id: 'trainingpeaks',
    name: 'TrainingPeaks',
    description: 'Import structured workouts and training plans',
    icon: BarChart3,
    iconColor: 'text-[#E31937]',
    status: 'coming-soon',
  },
];

export function IntegrationsSection() {
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    // Simulate connection process
    await new Promise(resolve => setTimeout(resolve, 1500));
    setConnectingId(null);
    // In real app, would redirect to OAuth flow
  };

  const handleDisconnect = async (id: string) => {
    setConnectingId(id);
    await new Promise(resolve => setTimeout(resolve, 800));
    setConnectingId(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Link2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Integrations</CardTitle>
            <CardDescription>Connect your training platforms and devices</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              integration={integration}
              isLoading={connectingId === integration.id}
              onConnect={() => handleConnect(integration.id)}
              onDisconnect={() => handleDisconnect(integration.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationCard({
  integration,
  isLoading,
  onConnect,
  onDisconnect,
}: {
  integration: Integration;
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const Icon = integration.icon;
  const isComingSoon = integration.status === 'coming-soon';
  const isConnected = integration.status === 'connected';

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg border transition-colors',
        integration.primary && isConnected && 'border-accent/50 bg-accent/5',
        isComingSoon && 'opacity-60'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center',
        isConnected ? 'bg-muted' : 'bg-muted/50'
      )}>
        <Icon className={cn('h-6 w-6', integration.iconColor)} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground">{integration.name}</h4>
          {integration.primary && (
            <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/30">
              Primary
            </Badge>
          )}
          {isComingSoon && (
            <Badge variant="outline" className="text-xs">
              Coming Soon
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
          {integration.description}
        </p>
        {isConnected && integration.lastSync && (
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Last synced {integration.lastSync}</span>
          </div>
        )}
      </div>

      {/* Status & Action */}
      <div className="flex items-center gap-3">
        {isConnected && (
          <div className="flex items-center gap-1.5 text-load-fresh">
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        )}

        {!isComingSoon && (
          <Button
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              'Loading...'
            ) : isConnected ? (
              <>
                <X className="h-4 w-4 mr-1" />
                Disconnect
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 mr-1" />
                Connect
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
