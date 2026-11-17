const EARTH_KM = 6371;

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export type GeoPoint = { id: string; lat: number; lng: number };

export type PlaceCluster = {
  lat: number;
  lng: number;
  photoIds: string[];
};

export function clusterByDistance(points: GeoPoint[], radiusKm = 0.15): PlaceCluster[] {
  const clusters: PlaceCluster[] = [];
  for (const point of points) {
    let best: PlaceCluster | null = null;
    let bestDist = Infinity;
    for (const cluster of clusters) {
      const dist = haversineKm(point.lat, point.lng, cluster.lat, cluster.lng);
      if (dist <= radiusKm && dist < bestDist) {
        best = cluster;
        bestDist = dist;
      }
    }
    if (best) {
      const n = best.photoIds.length;
      best.lat = (best.lat * n + point.lat) / (n + 1);
      best.lng = (best.lng * n + point.lng) / (n + 1);
      best.photoIds.push(point.id);
    } else {
      clusters.push({ lat: point.lat, lng: point.lng, photoIds: [point.id] });
    }
  }
  return clusters;
}

export function defaultPlaceName(lat: number, lng: number): string {
  return `Lieu près de ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
}
