import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import L, { LatLngBounds } from "leaflet";
import { useEffect } from "react";

// Fix Leaflet default marker icon issue with Vite/bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Apply the fix once
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface RouteMapProps {
  coordinates: [number, number][]; // [lat, lng]
  className?: string;
  height?: string;
}

export default function RouteMap({ 
  coordinates, 
  className = "",
  height = "h-[280px]"
}: RouteMapProps) {
  // Log when component renders for debugging
  useEffect(() => {
    console.log("[RouteMap] Rendering with", coordinates?.length || 0, "coordinates");
  }, [coordinates]);

  if (!coordinates || coordinates.length === 0) {
    console.log("[RouteMap] No coordinates provided, returning null");
    return null;
  }

  const bounds = new LatLngBounds(coordinates);

  return (
    <MapContainer
      bounds={bounds}
      className={`w-full ${height} rounded-lg ${className}`}
      scrollWheelZoom={false}
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline
        positions={coordinates}
        pathOptions={{ color: "hsl(var(--accent))", weight: 3 }}
      />
    </MapContainer>
  );
}

