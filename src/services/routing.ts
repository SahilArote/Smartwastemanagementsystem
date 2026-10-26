import type { CollectionPoint, Depot, RoutingResult } from '../types';

/**
 * Calculates straight-line distance in kilometers between two lat/lng coordinates (Haversine formula).
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Nearest-Neighbour Route Ordering (PRD Section 8)
 * Starting from the selected depot, repeatedly selects the nearest unvisited stop.
 * High priority stops receive priority weight bonus to break ties or visit earlier.
 */
export function calculateNearestNeighbourOrder(
  depot: { latitude: number; longitude: number },
  points: CollectionPoint[],
  prioritizeUrgent: boolean = true
): CollectionPoint[] {
  // Filter out any points with invalid coordinates
  const validPoints = points.filter(
    (p) =>
      typeof p.latitude === 'number' &&
      !isNaN(p.latitude) &&
      typeof p.longitude === 'number' &&
      !isNaN(p.longitude) &&
      p.latitude >= -90 &&
      p.latitude <= 90 &&
      p.longitude >= -180 &&
      p.longitude <= 180
  );

  if (validPoints.length <= 1) {
    return [...validPoints];
  }

  const unvisited = [...validPoints];
  const orderedRoute: CollectionPoint[] = [];

  let currentLat = depot.latitude;
  let currentLng = depot.longitude;

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minWeightedScore = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      const rawDistance = calculateHaversineDistance(
        currentLat,
        currentLng,
        candidate.latitude,
        candidate.longitude
      );

      // Priority weighting hint:
      // High priority reduces effective distance score by up to 25% for tie-breaking/earlier grouping
      let weightFactor = 1.0;
      if (prioritizeUrgent) {
        if (candidate.priority === 'High') weightFactor = 0.75;
        else if (candidate.priority === 'Medium') weightFactor = 0.9;
        else weightFactor = 1.0;
      }

      const score = rawDistance * weightFactor;

      if (score < minWeightedScore) {
        minWeightedScore = score;
        nearestIndex = i;
      }
    }

    const selectedStop = unvisited.splice(nearestIndex, 1)[0];
    orderedRoute.push(selectedStop);
    currentLat = selectedStop.latitude;
    currentLng = selectedStop.longitude;
  }

  return orderedRoute;
}

/**
 * Requests road network geometry and road distance from OSRM public API.
 * Gracefully falls back to straight-line polyline and Haversine distance with road factor if OSRM is offline.
 */
export async function fetchRoadRoute(
  depot: Depot | { latitude: number; longitude: number; name?: string },
  orderedStops: CollectionPoint[],
  returnToDepot: boolean = false
): Promise<RoutingResult> {
  const allWaypoints: { latitude: number; longitude: number }[] = [
    { latitude: depot.latitude, longitude: depot.longitude },
    ...orderedStops.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
  ];

  if (returnToDepot) {
    allWaypoints.push({ latitude: depot.latitude, longitude: depot.longitude });
  }

  // Generate fallback straight-line polyline coordinates [lat, lng]
  const fallbackCoordinates: [number, number][] = allWaypoints.map((p) => [
    p.latitude,
    p.longitude,
  ]);

  let fallbackDistanceKm = 0;
  for (let i = 0; i < allWaypoints.length - 1; i++) {
    fallbackDistanceKm += calculateHaversineDistance(
      allWaypoints[i].latitude,
      allWaypoints[i].longitude,
      allWaypoints[i + 1].latitude,
      allWaypoints[i + 1].longitude
    );
  }
  // Urban road winding correction multiplier (typically 1.35x straight line)
  fallbackDistanceKm = Number((fallbackDistanceKm * 1.35).toFixed(2));
  // Rough estimate: 25 km/h urban average speed + 4 min per collection stop
  const fallbackDurationMin = Math.round(
    (fallbackDistanceKm / 25) * 60 + orderedStops.length * 4
  );

  // OSRM coordinates format: lon1,lat1;lon2,lat2;...
  const coordsString = allWaypoints
    .map((wp) => `${wp.longitude.toFixed(6)},${wp.latitude.toFixed(6)}`)
    .join(';');

  const osrmBase = (import.meta.env.VITE_OSRM_API_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
  const osrmUrl = `${osrmBase}/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500); // 6.5s timeout

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Routing service returned status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error(data.message || 'No route found for selected points');
    }

    const route = data.routes[0];
    const distanceKm = Number((route.distance / 1000).toFixed(2));
    const durationMinutes = Math.round(route.duration / 60) + orderedStops.length * 4; // Add service stop time

    // GeoJSON coordinates come in [lon, lat], Leaflet needs [lat, lng]
    const latLngCoordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    return {
      coordinates: latLngCoordinates,
      distanceKm,
      durationMinutes,
      isFallback: false,
    };
  } catch (err: any) {
    console.warn('OSRM route lookup failed or rate-limited, switching to fallback:', err);
    return {
      coordinates: fallbackCoordinates,
      distanceKm: fallbackDistanceKm,
      durationMinutes: fallbackDurationMin,
      isFallback: true,
      error: err.name === 'AbortError' 
        ? 'Routing service timed out. Used approximate road distance estimate.' 
        : 'OSRM routing unavailable. Displaying approximate straight-line route.',
    };
  }
}
