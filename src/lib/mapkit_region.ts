const MIN_SPAN_DEGREES = 0.01;
const BOUNDS_PADDING_FACTOR = 3.25;

/**
 * MapKit JS no tiene un equivalente a google.maps.LatLngBounds. Esto calcula
 * una CoordinateRegion que encuadra un set de puntos lat/lng crudos, para
 * reemplazar lo que hacía bounds.extend(...) + fitBounds(...) en Google.
 */
export function regionFromPoints(
  points: Array<{ lat: number; lng: number }>
): MapKitJS.CoordinateRegion {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    center: { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2 },
    span: {
      latitudeDelta: Math.max((maxLat - minLat) * BOUNDS_PADDING_FACTOR, MIN_SPAN_DEGREES),
      longitudeDelta: Math.max((maxLng - minLng) * BOUNDS_PADDING_FACTOR, MIN_SPAN_DEGREES),
    },
  };
}
