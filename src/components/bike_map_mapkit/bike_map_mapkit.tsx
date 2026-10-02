"use client";

import { useEffect, useRef } from "react";
import { getOperatorSlugByEmpresa, getRoutesByOperator, ROUTE_COLOR_HEX } from "@/data/routes";
import { useTheme } from "@/hooks/useTheme";
import { useMapKitScript } from "@/hooks/use_mapkit_script";
import { hasActiveRide, type LatLng, type LiveBike } from "@/hooks/use_live_bikes";
import { regionFromPoints } from "@/lib/mapkit_region";
import styles from "./bike_map_mapkit.module.css";

const MAPKIT_TOKEN = process.env.NEXT_PUBLIC_MAPKIT_TOKEN ?? "";
const DEFAULT_PIN_COLOR = "#000000";
const DEFAULT_CENTER = { lat: 31.86, lng: -116.6 };

type RidingBike = LiveBike & { rider_location: LatLng };

/** Igual que un bus con chofer: solo se pinta mientras el ride siga vivo. */
function isRiding(bike: LiveBike): bike is RidingBike {
  return hasActiveRide(bike);
}

interface BikeMapProps {
  empresa: string;
  bikes: LiveBike[];
  height?: number;
}

export function BikeMapMapKit({ empresa, bikes, height = 420 }: BikeMapProps) {
  const map_container_ref = useRef<HTMLDivElement>(null);
  const map_ref = useRef<MapKitJS.Map | null>(null);
  const markers_ref = useRef<Map<string, MapKitJS.Annotation>>(new Map());
  const previous_riding_count_ref = useRef<number | null>(null);
  const theme = useTheme();
  const { isLoaded, error } = useMapKitScript(MAPKIT_TOKEN);
  const riding_bikes = bikes.filter(isRiding);

  const operator_slug = getOperatorSlugByEmpresa(empresa) ?? empresa;
  const routes = getRoutesByOperator(operator_slug);
  const pin_color = routes[0] ? ROUTE_COLOR_HEX[routes[0].color] : DEFAULT_PIN_COLOR;

  // Crear el mapa una sola vez
  useEffect(() => {
    if (!isLoaded || !map_container_ref.current || map_ref.current || !window.mapkit) return;

    const { mapkit } = window;
    const points = routes.flatMap((route) => [
      ...route.path,
      ...route.stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
    ]);
    const region = regionFromPoints(points.length > 0 ? points : [DEFAULT_CENTER]);

    const map = new mapkit.Map(map_container_ref.current, {
      colorScheme: theme === "dark" ? mapkit.ColorScheme.Dark : mapkit.ColorScheme.Light,
      region,
      showsMapTypeControl: false,
      showsZoomControl: false,
      showsUserLocationControl: false,
      isRotationEnabled: false,
    });

    map_ref.current = map;

    return () => {
      map.destroy();
      map_ref.current = null;
    };
    // Igual que bus_map_mapkit: el mapa se crea una sola vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, operator_slug]);

  // Mover / agregar / quitar pines en cada snapshot (~10 s durante un ride)
  useEffect(() => {
    if (!map_ref.current || !window.mapkit) return;

    const { mapkit } = window;
    const map = map_ref.current;
    const markers = markers_ref.current;
    const riding_ids = new Set(riding_bikes.map((bike) => bike.id));

    // Sin rider_location → se quita el pin (igual que un bus sin chofer)
    markers.forEach((marker, id) => {
      if (!riding_ids.has(id)) {
        map.removeAnnotation(marker);
        markers.delete(id);
      }
    });

    riding_bikes.forEach((bike) => {
      const coordinate = { latitude: bike.rider_location.lat, longitude: bike.rider_location.lng };
      const label = bike.number;

      const existing = markers.get(bike.id);
      if (existing) {
        existing.coordinate = coordinate;
        existing.title = label;
        return;
      }

      const marker = new mapkit.Annotation(
        coordinate,
        () => {
          const content = document.createElement("div");
          content.className = styles.bikePin;

          const circle = document.createElement("span");
          circle.className = styles.bikeCircle;
          circle.style.backgroundColor = pin_color;

          const icon = document.createElement("span");
          icon.className = styles.bikeIcon;
          circle.appendChild(icon);
          content.appendChild(circle);

          const label_el = document.createElement("span");
          label_el.className = styles.bikeLabel;
          label_el.textContent = label;
          content.appendChild(label_el);

          return content;
        },
        { title: label }
      );

      map.addAnnotation(marker);
      markers.set(bike.id, marker);
    });

    if (riding_bikes.length > 0 && riding_bikes.length !== previous_riding_count_ref.current) {
      previous_riding_count_ref.current = riding_bikes.length;
      const region = regionFromPoints(riding_bikes.map((bike) => bike.rider_location));
      map.setRegionAnimated(region, true);
    }
  }, [riding_bikes, pin_color]);

  // Limpiar pines al desmontar
  useEffect(() => {
    const markers = markers_ref.current;
    return () => {
      markers.forEach((marker) => map_ref.current?.removeAnnotation(marker));
      markers.clear();
    };
  }, []);

  if (!MAPKIT_TOKEN) {
    return (
      <div className={styles.placeholder} style={{ height }}>
        Configura NEXT_PUBLIC_MAPKIT_TOKEN para ver el mapa.
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.placeholder} style={{ height }}>
        {error.message}
      </div>
    );
  }

  return <div ref={map_container_ref} className={styles.map} style={{ height }} />;
}
