"use client";

import { useEffect, useRef } from "react";
import { getOperatorSlugByEmpresa, getRoutesByOperator, ROUTE_COLOR_HEX } from "@/data/routes";
import { useTheme } from "@/hooks/useTheme";
import { useMapKitScript } from "@/hooks/use_mapkit_script";
import { hasAssignedDriver, type LiveBus } from "@/hooks/use_live_buses";
import { regionFromPoints } from "@/lib/mapkit_region";
import styles from "./bus_map_mapkit.module.css";

const MAPKIT_TOKEN = process.env.NEXT_PUBLIC_MAPKIT_TOKEN ?? "";
const DEFAULT_PIN_COLOR = "#000000";
const DEFAULT_CENTER = { lat: 31.86, lng: -116.6 };

interface BusMapProps {
  empresa: string;
  buses: LiveBus[];
  height?: number;
}

export function BusMapMapKit({ empresa, buses, height = 420 }: BusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapKitJS.Map | null>(null);
  const markersRef = useRef<Map<string, MapKitJS.Annotation>>(new Map());
  const previousActiveDriversCountRef = useRef<number | null>(null);
  const theme = useTheme();
  const { isLoaded, error } = useMapKitScript(MAPKIT_TOKEN);
  const activeBuses = buses.filter(hasAssignedDriver);

  const operatorSlug = getOperatorSlugByEmpresa(empresa) ?? empresa;
  const routes = getRoutesByOperator(operatorSlug);
  const pinColor = routes[0] ? ROUTE_COLOR_HEX[routes[0].color] : DEFAULT_PIN_COLOR;

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current || !window.mapkit) return;

    const { mapkit } = window;
    const points = routes.flatMap((route) => [
      ...route.path,
      ...route.stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
    ]);
    const region = regionFromPoints(points.length > 0 ? points : [DEFAULT_CENTER]);

    const map = new mapkit.Map(mapContainerRef.current, {
      colorScheme: theme === "dark" ? mapkit.ColorScheme.Dark : mapkit.ColorScheme.Light,
      region,
      showsMapTypeControl: false,
      showsZoomControl: false,
      showsUserLocationControl: false,
      isRotationEnabled: false,
    });

    mapRef.current = map;

    return () => {
      map.destroy();
      mapRef.current = null;
    };
    // Igual que en bus_map.tsx original: el mapa se crea una sola vez (guard de
    // mapRef.current) y no se re-crea si cambia el tema después del montaje.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, operatorSlug]);

  useEffect(() => {
    if (!mapRef.current || !window.mapkit) return;

    const { mapkit } = window;
    const map = mapRef.current;
    const markers = markersRef.current;
    const activeIds = new Set(activeBuses.map((bus) => bus.id));

    markers.forEach((marker, id) => {
      if (!activeIds.has(id)) {
        map.removeAnnotation(marker);
        markers.delete(id);
      }
    });

    activeBuses.forEach((bus) => {
      const coordinate = { latitude: bus.lat, longitude: bus.lng };
      const firstName = bus.driverName.trim().split(/\s+/)[0] ?? "";
      const label = [firstName, bus.unidad].filter(Boolean).join(" ");

      const existing = markers.get(bus.id);
      if (existing) {
        existing.coordinate = coordinate;
        existing.title = label;
        const labelEl = existing.element.querySelector<HTMLElement>(`.${styles.busLabel}`);
        if (labelEl) labelEl.textContent = label;
        return;
      }

      const marker = new mapkit.Annotation(
        coordinate,
        () => {
          const content = document.createElement("div");
          content.className = styles.busPin;

          const circle = document.createElement("span");
          circle.className = styles.busCircle;
          circle.style.backgroundColor = pinColor;

          const icon = document.createElement("span");
          icon.className = styles.busIcon;
          circle.appendChild(icon);

          content.appendChild(circle);

          const labelEl = document.createElement("span");
          labelEl.className = styles.busLabel;
          labelEl.textContent = label;

          content.appendChild(labelEl);

          return content;
        },
        { title: label }
      );

      map.addAnnotation(marker);
      markers.set(bus.id, marker);
    });

    if (activeBuses.length > 0 && activeBuses.length !== previousActiveDriversCountRef.current) {
      previousActiveDriversCountRef.current = activeBuses.length;
      const region = regionFromPoints(activeBuses.map((bus) => ({ lat: bus.lat, lng: bus.lng })));
      map.setRegionAnimated(region, true);
    }
  }, [activeBuses, pinColor]);

  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => mapRef.current?.removeAnnotation(marker));
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

  return <div ref={mapContainerRef} className={styles.map} style={{ height }} />;
}
