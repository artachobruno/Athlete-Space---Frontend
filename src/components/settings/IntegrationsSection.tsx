import { useState, useEffect } from 'react';
import { CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Link2, Check, X, Clock, ExternalLink, Loader2, RefreshCw,
  Activity, Watch, Heart, Apple, BarChart3
} from 'lucide-react';
import { getStravaStatus, initiateStravaConnect, disconnectStrava, syncStravaData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

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
    status: 'coming-soon',
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
  const { user, status } = useAuth();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [stravaStatus, setStravaStatus] = useState<{ connected: boolean; athlete_id?: string | number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncingStrava, setSyncingStrava] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    // Only load integration status when authenticated
    // This component is inside RequireAuth, but gate the API call anyway
    if (status !== "authenticated" || !user) return;
    
    loadIntegrationStatus();
  }, [status, user]);

  const loadIntegrationStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getStravaStatus();
      setStravaStatus(status);
      const storedLastSync = localStorage.getItem('strava_last_sync');
      if (storedLastSync) {
        setLastSync(storedLastSync);
      }
    } catch (error) {
      console.error('Failed to load integration status:', error);
      setStravaStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (id: string) => {
    if (id === 'strava') {
      setConnectingId(id);
      try {
        await initiateStravaConnect();
        // This will redirect, so we won't reach here
      } catch (error) {
        console.error('Failed to connect Strava:', error);
        toast({
          title: 'Failed to connect Strava',
          description: error instanceof Error ? error.message : 'Could not initiate Strava connection',
          variant: 'destructive',
        });
        setConnectingId(null);
      }
    } else {
      toast({
        title: 'Coming soon',
        description: 'This integration will be available soon',
      });
    }
  };

  const handleDisconnect = async (id: string) => {
    if (id === 'strava') {
      setConnectingId(id);
      try {
        await disconnectStrava();
        setStravaStatus({ connected: false });
        toast({
          title: 'Strava disconnected',
          description: 'Your Strava account has been disconnected',
        });
      } catch (error) {
        // Only show error if status >= 500 (server errors)
        const apiError = error as { status?: number; message?: string };
        if (apiError.status && apiError.status >= 500) {
        console.error('Failed to disconnect Strava:', error);
        toast({
          title: 'Failed to disconnect',
          description: error instanceof Error ? error.message : 'Could not disconnect Strava',
          variant: 'destructive',
        });
        } else {
          // For 4xx or other errors, treat as success (user is likely already disconnected)
          setStravaStatus({ connected: false });
          toast({
            title: 'Strava disconnected',
            description: 'Your Strava account has been disconnected',
          });
        }
      } finally {
        setConnectingId(null);
      }
    }
  };

  const handleSyncStrava = async () => {
    setSyncingStrava(true);
    try {
      await syncStravaData();
      const now = new Date().toISOString();
      localStorage.setItem('strava_last_sync', now);
      setLastSync(now);
      toast({
        title: 'Sync started',
        description: 'Your Strava data is being synced. This may take a few moments.',
      });
    } catch (error) {
      console.error('Failed to sync Strava:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Could not sync Strava data',
        variant: 'destructive',
      });
    } finally {
      setSyncingStrava(false);
    }
  };

  const formatLastSync = (syncTime: string | null): string => {
    if (!syncTime) return 'Never';
    const date = new Date(syncTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const updatedIntegrations: Integration[] = integrations.map(integration => {
    if (integration.id === 'strava') {
      return {
        ...integration,
        status: stravaStatus?.connected ? 'connected' as const : 'disconnected' as const,
        lastSync: lastSync ? formatLastSync(lastSync) : undefined,
      };
    }
    return integration;
  });

  return (
    <GlassCard>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {updatedIntegrations.map((integration) => (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                isLoading={connectingId === integration.id}
                isSyncing={syncingStrava && integration.id === 'strava'}
                onConnect={() => handleConnect(integration.id)}
                onDisconnect={() => handleDisconnect(integration.id)}
                onSync={integration.id === 'strava' ? handleSyncStrava : undefined}
              />
            ))}
          </div>
        )}
      </CardContent>
    </GlassCard>
  );
}

function IntegrationCard({
  integration,
  isLoading,
  isSyncing,
  onConnect,
  onDisconnect,
  onSync,
}: {
  integration: Integration;
  isLoading: boolean;
  isSyncing?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
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

        {isConnected && onSync && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Sync
              </>
            )}
          </Button>
        )}

        {!isComingSoon && (
          <Button
            variant={isConnected ? 'outline' : 'default'}
            size="sm"
            onClick={isConnected ? onDisconnect : onConnect}
            disabled={isLoading || isSyncing}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading...
              </>
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
