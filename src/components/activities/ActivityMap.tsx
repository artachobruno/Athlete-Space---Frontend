import { MapPin, Navigation } from 'lucide-react';
import RouteMap from '../RouteMap';

interface ActivityMapProps {
  coordinates?: [number, number][]; // [lat, lng]
}

export function ActivityMap({ coordinates }: ActivityMapProps) {
  // If coordinates are provided, render the actual map
  if (coordinates && coordinates.length > 0) {
    return <RouteMap coordinates={coordinates} height="h-64" />;
  }

  // Placeholder when no route data is available
  return (
    <div className="relative h-64 bg-muted/30 rounded-lg overflow-hidden">
      {/* Placeholder map visualization */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
            <Navigation className="h-8 w-8 text-accent" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">Route Map</p>
          <p className="text-xs text-muted-foreground">
            No GPS data available for this activity
          </p>
        </div>
      </div>

      {/* Decorative route line */}
      <svg
        className="absolute inset-0 w-full h-full opacity-20"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
      >
        <path
          d="M 20 100 Q 80 40 140 90 T 260 70 T 380 100"
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Start marker */}
        <circle cx="20" cy="100" r="6" fill="hsl(var(--load-fresh))" />
        {/* End marker */}
        <circle cx="380" cy="100" r="6" fill="hsl(var(--chart-4))" />
      </svg>

      {/* Mock stats overlay */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-between">
        <div className="bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs">
          <div className="flex items-center gap-1 text-load-fresh">
            <MapPin className="h-3 w-3" />
            <span>Start</span>
          </div>
        </div>
        <div className="bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-md text-xs">
          <div className="flex items-center gap-1 text-chart-4">
            <MapPin className="h-3 w-3" />
            <span>Finish</span>
          </div>
        </div>
      </div>
    </div>
  );
}
