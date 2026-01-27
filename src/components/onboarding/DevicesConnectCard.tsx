import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Activity, ExternalLink, Watch, Upload } from 'lucide-react';
import { initiateStravaConnect, initiateGarminConnect } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

interface DevicesConnectCardProps {
  onConnect: (provider: 'strava' | 'garmin') => void;
  onSkip: () => void;
}

export function DevicesConnectCard({ onConnect, onSkip }: DevicesConnectCardProps) {
  const [isConnectingStrava, setIsConnectingStrava] = useState(false);
  const [isConnectingGarmin, setIsConnectingGarmin] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const navigate = useNavigate();

  const handleConnectStrava = async () => {
    setIsConnectingStrava(true);
    try {
      await initiateStravaConnect();
      // Note: We won't reach here because initiateStravaConnect redirects
    } catch (error) {
      setIsConnectingStrava(false);
      console.error('Failed to connect Strava:', error);
      
      let errorMessage = 'Could not initiate Strava connection';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Strava Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleConnectGarmin = async () => {
    setIsConnectingGarmin(true);
    try {
      await initiateGarminConnect();
      // Note: We won't reach here because initiateGarminConnect redirects
    } catch (error) {
      setIsConnectingGarmin(false);
      console.error('Failed to connect Garmin:', error);
      
      // Check for EMAIL_REQUIRED error
      if (error instanceof Error && error.message === 'EMAIL_REQUIRED') {
        setShowEmailModal(true);
        return;
      }
      
      let errorMessage = 'Could not initiate Garmin connection';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Garmin Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <div className="ml-12 mt-4 space-y-3">
        <GlassCard className="border-accent/30 bg-accent/5">
          <CardContent className="p-4 space-y-3">
            {/* Strava - Primary */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#FC4C02]/10 flex items-center justify-center shrink-0">
                <Activity className="h-6 w-6 text-[#FC4C02]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">Connect Strava</h4>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">Recommended</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Sync workouts automatically from your devices
                </p>
                <Button 
                  onClick={handleConnectStrava} 
                  disabled={isConnectingStrava || isConnectingGarmin}
                  className="bg-[#FC4C02] hover:bg-[#FC4C02]/90"
                >
                  {isConnectingStrava ? (
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

            {/* Garmin - Secondary */}
            <div className="flex items-start gap-4 pt-3 border-t border-border/50">
              <div className="w-12 h-12 rounded-lg bg-[#007CC3]/10 flex items-center justify-center shrink-0">
                <Watch className="h-6 w-6 text-[#007CC3]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-1">Connect Garmin</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Import workouts and physiological metrics from Garmin devices
                </p>
                <Button 
                  onClick={handleConnectGarmin} 
                  disabled={isConnectingStrava || isConnectingGarmin}
                  variant="outline"
                >
                  {isConnectingGarmin ? (
                    'Connecting...'
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Garmin
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </GlassCard>

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

      {/* Email Verification Modal */}
      <AlertDialog open={showEmailModal} onOpenChange={setShowEmailModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email Verification Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please verify your email before connecting Garmin. This ensures we can securely sync your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate('/settings')}>
              Verify Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
