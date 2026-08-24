"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useGoogleMapsScript } from "@/hooks/use_google_maps_script";
import type { LatLngLiteral, RouteStop } from "@/data/routes";
import styles from "./route_map.module.css";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const MAP_ID_LIGHT = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT ?? "";
const MAP_ID_DARK = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_DARK ?? "";

interface RouteMapProps {
  path: LatLngLiteral[];
  stops: RouteStop[];
  color: string;
  stopIconSrc: string;
  height?: number;
}

export function RouteMap({
  path,
  stops,
  color,
  stopIconSrc,
  height = 420,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const { isLoaded, error } = useGoogleMapsScript(GOOGLE_MAPS_API_KEY);
  const mapId = theme === "dark" ? MAP_ID_DARK : MAP_ID_LIGHT;

  const hasPath = path.length > 0;
  const hasStops = stops.length > 0;

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || (!hasPath && !hasStops)) {
      return;
    }

    let isCancelled = false;

    (async () => {
      const mapsLibrary = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
      const markerLibrary = (await google.maps.importLibrary("marker")) as google.maps.MarkerLibrary;

      if (isCancelled || !mapContainerRef.current) return;

      const { Map } = mapsLibrary;
      const { AdvancedMarkerElement } = markerLibrary;

      const bounds = new google.maps.LatLngBounds();
      path.forEach((point) => bounds.extend(point));
      stops.forEach((stop) => bounds.extend({ lat: stop.lat, lng: stop.lng }));

      const center = hasPath
        ? path[0]
        : { lat: stops[0].lat, lng: stops[0].lng };

      const map = new Map(mapContainerRef.current, {
        mapId: mapId || undefined,
        center,
        zoom: 13,
        gestureHandling: "cooperative",
        disableDefaultUI: true,
        keyboardShortcuts: false,
      });

      map.fitBounds(bounds, 48);

      if (hasPath) {
        new google.maps.Polyline({
          path,
          map,
          strokeColor: color,
          strokeOpacity: 1,
          strokeWeight: 4,
        });
      }

      stops.forEach((stop, index) => {
        const icon = document.createElement("img");
        icon.src = stopIconSrc;
        icon.alt = `Parada ${index + 1}`;
        icon.style.width = "36px";
        icon.style.height = "36px";

        new AdvancedMarkerElement({
          map,
          position: { lat: stop.lat, lng: stop.lng },
          title: `Parada ${index + 1}`,
          content: icon,
        });
      });

      const recenterButton = document.createElement("button");
      recenterButton.type = "button";
      recenterButton.className = styles.recenterButton;
      recenterButton.setAttribute("aria-label", "Centrar mapa en las paradas");
      recenterButton.setAttribute("title", "Centrar mapa en las paradas");

      const recenterIcon = document.createElement("span");
      recenterIcon.className = "material-symbols-rounded";
      recenterIcon.textContent = "my_location";
      recenterButton.appendChild(recenterIcon);

      recenterButton.addEventListener("click", () => {
        map.fitBounds(bounds, 48);
      });

      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(recenterButton);
    })();

    return () => {
      isCancelled = true;
    };
  }, [isLoaded, path, stops, color, mapId, hasPath, hasStops, stopIconSrc]);

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
