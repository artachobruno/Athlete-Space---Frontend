import { Loader2 } from 'lucide-react';
import { ActivityMap } from '@/components/activities/ActivityMap';

interface MapTabProps {
  routeCoordinates?: [number, number][];
  isLoading?: boolean;
  error?: Error | null;
}

export function MapTab({ routeCoordinates, isLoading, error }: MapTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !routeCoordinates || routeCoordinates.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <span className="text-sm">No route data available.</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <ActivityMap coordinates={routeCoordinates} />
    </div>
  );
}
