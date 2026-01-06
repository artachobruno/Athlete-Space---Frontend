import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, ExternalLink, Upload } from 'lucide-react';

interface StravaConnectCardProps {
  onConnect: () => void;
  onSkip: () => void;
}

export function StravaConnectCard({ onConnect, onSkip }: StravaConnectCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulate OAuth flow
    setTimeout(() => {
      onConnect();
    }, 1500);
  };

  return (
    <div className="ml-12 mt-4 space-y-3">
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
              <Activity className="h-6 w-6 text-[#FC4C02]" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-1">Connect Strava</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Review your training history for accurate, personalized coaching
              </p>
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="bg-[#FC4C02] hover:bg-[#FC4C02]/90"
              >
                {isConnecting ? (
                  'Connecting...'
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect Strava
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
          Skip for now
        </Button>
        <span className="text-xs text-muted-foreground">or</span>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Upload files instead
        </Button>
      </div>
    </div>
  );
}
