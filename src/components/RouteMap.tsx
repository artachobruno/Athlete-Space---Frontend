import { MapContainer, TileLayer, Polyline } from "react-leaflet";
import { LatLngBounds } from "leaflet";

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
  if (!coordinates || coordinates.length === 0) {
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

