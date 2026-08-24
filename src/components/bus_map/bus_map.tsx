"use client";

import { useEffect, useRef } from "react";
import {
  getOperatorSlugByEmpresa,
  getRoutesByOperator,
  ROUTE_COLOR_HEX,
} from "@/data/routes";
import { useTheme } from "@/hooks/useTheme";
import { useGoogleMapsScript } from "@/hooks/use_google_maps_script";
import { isBusActive, type LiveBus } from "@/hooks/use_live_buses";
import styles from "./bus_map.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID_LIGHT = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT ?? "";
const MAP_ID_DARK = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_DARK ?? "";
const DEFAULT_PIN_COLOR = "#000000";

interface BusMapProps {
  empresa: string;
  buses: LiveBus[];
  height?: number;
}

export function BusMap({ empresa, buses, height = 420 }: BusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const theme = useTheme();
  const { isLoaded, error } = useGoogleMapsScript(GOOGLE_MAPS_API_KEY);
  const mapId = theme === "dark" ? MAP_ID_DARK : MAP_ID_LIGHT;
  const activeBuses = buses.filter(isBusActive);

  const operatorSlug = getOperatorSlugByEmpresa(empresa) ?? empresa;
  const routes = getRoutesByOperator(operatorSlug);
  const pinColor = routes[0] ? ROUTE_COLOR_HEX[routes[0].color] : DEFAULT_PIN_COLOR;

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current) return;

    let isCancelled = false;

    (async () => {
      const mapsLibrary = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
      await google.maps.importLibrary("marker");

      if (isCancelled || !mapContainerRef.current) return;

      const { Map } = mapsLibrary;

      const bounds = new google.maps.LatLngBounds();
      routes.forEach((route) => {
        route.path.forEach((point) => bounds.extend(point));
        route.stops.forEach((stop) => bounds.extend({ lat: stop.lat, lng: stop.lng }));
      });

      const map = new Map(mapContainerRef.current, {
        mapId: mapId || undefined,
        center: bounds.isEmpty() ? { lat: 31.86, lng: -116.6 } : bounds.getCenter(),
        zoom: 13,
        gestureHandling: "cooperative",
        disableDefaultUI: true,
        keyboardShortcuts: false,
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 48);
      }

      mapRef.current = map;
    })();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, mapId, operatorSlug]);

  useEffect(() => {
    if (!mapRef.current) return;

    let isCancelled = false;

    (async () => {
      const markerLibrary = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;
      if (isCancelled || !mapRef.current) return;

      const { AdvancedMarkerElement } = markerLibrary;
      const map = mapRef.current;
      const markers = markersRef.current;
      const activeIds = new Set(activeBuses.map((bus) => bus.id));

      markers.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.map = null;
          markers.delete(id);
        }
      });

      activeBuses.forEach((bus) => {
        const position = { lat: bus.lat, lng: bus.lng };
        const firstName = bus.driverName.trim().split(/\s+/)[0] ?? "";
        const label = [firstName, bus.unidad].filter(Boolean).join(" ");

        const existing = markers.get(bus.id);
        if (existing) {
          existing.position = position;
          existing.title = label;
          return;
        }

        const content = document.createElement("div");
        content.className = styles.busPin;

        const dot = document.createElement("span");
        dot.className = styles.busDot;
        dot.style.backgroundColor = pinColor;
        content.appendChild(dot);

        const labelEl = document.createElement("span");
        labelEl.className = styles.busLabel;
        labelEl.textContent = label;
        content.appendChild(labelEl);

        const marker = new AdvancedMarkerElement({
          map,
          position,
          content,
          title: label,
        });

        markers.set(bus.id, marker);
      });
    })();

    return () => {
      isCancelled = true;
    };
  }, [activeBuses, pinColor]);

  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => {
        marker.map = null;
      });
      markers.clear();
    };
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className={styles.placeholder} style={{ height }}>
        Configura NEXT_PUBLIC_GOOGLE_MAPS_API_KEY para ver el mapa.
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
