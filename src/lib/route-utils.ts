/**
 * Normalizes route points from various API formats to a consistent array of [lat, lng] tuples.
 * Handles different formats that the backend might return:
 * - Direct array: [[lat, lng], ...]
 * - Object with latlng: { latlng: [[lat, lng], ...] }
 * - Object with data: { data: [[lat, lng], ...] }
 * - Object with route_points: { route_points: [[lat, lng], ...] }
 * - Empty/undefined/null values
 * 
 * @param routePoints - Route points from API (can be array, object, or undefined)
 * @returns Array of [lat, lng] tuples, or empty array if invalid
 */
export function normalizeRoutePoints(
  routePoints: unknown
): Array<[number, number]> {
  // Handle null/undefined
  if (!routePoints) {
    return [];
  }

  // Already normalized array format: [[lat, lng], ...]
  if (Array.isArray(routePoints)) {
    return routePoints
      .map((coord): [number, number] | null => {
        // Ensure each coordinate is an array with at least 2 elements
        if (Array.isArray(coord) && coord.length >= 2) {
          const lat = typeof coord[0] === 'number' ? coord[0] : 0;
          const lng = typeof coord[1] === 'number' ? coord[1] : 0;
          // Filter out invalid coordinates (both 0,0 or invalid numbers)
          if ((lat !== 0 || lng !== 0) && !isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
          }
        }
        return null;
      })
      .filter((coord): coord is [number, number] => coord !== null);
  }

  // Handle object formats
  if (typeof routePoints === 'object' && routePoints !== null) {
    const routeObj = routePoints as Record<string, unknown>;

    // Strava latlng stream: { latlng: [[lat, lng], ...] }
    if (Array.isArray(routeObj.latlng)) {
      return normalizeRoutePoints(routeObj.latlng);
    }

    // Some APIs return { data: [...] }
    if (Array.isArray(routeObj.data)) {
      return normalizeRoutePoints(routeObj.data);
    }

    // Some APIs return { route_points: [...] }
    if (Array.isArray(routeObj.route_points)) {
      return normalizeRoutePoints(routeObj.route_points);
    }

    // Some APIs return { points: [...] }
    if (Array.isArray(routeObj.points)) {
      return normalizeRoutePoints(routeObj.points);
    }
  }

  // Invalid format, return empty array
  return [];
}

/**
 * Normalizes route points from a streams response object.
 * Handles the ActivityStreamsResponse format where route_points might be in various formats.
 * 
 * @param streamsData - Streams data from API
 * @returns Array of [lat, lng] tuples, or empty array if invalid
 */
export function normalizeRoutePointsFromStreams(
  streamsData: { route_points?: unknown } | null | undefined
): Array<[number, number]> {
  if (!streamsData) {
    return [];
  }

  return normalizeRoutePoints(streamsData.route_points);
}

