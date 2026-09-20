"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useMapKitScript } from "@/hooks/use_mapkit_script";
import type { LatLngLiteral, RouteStop } from "@/data/routes";
import styles from "./route_map_mapkit.module.css";

const MAPKIT_TOKEN = process.env.NEXT_PUBLIC_MAPKIT_TOKEN ?? "";

interface RouteMapProps {
  path: LatLngLiteral[];
  stops: RouteStop[];
  color: string;
  stopIconSrc: string;
  height?: number;
}

export function RouteMapMapKit({
  path,
  stops,
  color,
  stopIconSrc,
  height = 420,
}: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  // Se conserva entre re-creaciones del mapa (p. ej. al cambiar de tema).
  const stopsVisibleRef = useRef(true);
  const { isLoaded, error } = useMapKitScript(MAPKIT_TOKEN);

  const hasPath = path.length > 0;
  const hasStops = stops.length > 0;

  useEffect(() => {
    if (!isLoaded || !theme || !mapContainerRef.current || (!hasPath && !hasStops) || !window.mapkit) {
      return;
    }

    const { mapkit } = window;
    const container = mapContainerRef.current;

    const center = hasPath
      ? { latitude: path[0].lat, longitude: path[0].lng }
      : { latitude: stops[0].lat, longitude: stops[0].lng };

    const map = new mapkit.Map(container, {
      colorScheme: theme === "dark" ? mapkit.ColorScheme.Dark : mapkit.ColorScheme.Light,
      region: { center, span: { latitudeDelta: 0.05, longitudeDelta: 0.05 } },
      showsMapTypeControl: false,
      showsZoomControl: false,
      showsUserLocationControl: false,
      isRotationEnabled: false,
    });

    const pathItems: Array<MapKitJS.Annotation | MapKitJS.PolylineOverlay> = [];

    if (hasPath) {
      const points = path.map((point) => ({ latitude: point.lat, longitude: point.lng }));
      const polyline = new mapkit.PolylineOverlay(points, {
        style: new mapkit.Style({ strokeColor: color, strokeOpacity: 1, lineWidth: 4 }),
      });
      map.addOverlay(polyline);
      pathItems.push(polyline);
    }

    // Los marcadores se crean y agregan una sola vez; mostrar/ocultar solo cambia `visible`.
    const stopAnnotations: MapKitJS.Annotation[] = [];
    stops.forEach((stop, index) => {
      const label = stop.label ?? String(index + 1);
      const title = stop.isTerminal ? "Inicio/Fin" : `Parada ${label}`;
      stopAnnotations.push(
        new mapkit.Annotation(
          { latitude: stop.lat, longitude: stop.lng },
          () => {
            const icon = document.createElement("img");
            icon.src = stopIconSrc;
            icon.alt = title;
            icon.style.width = "36px";
            icon.style.height = "36px";
            return icon;
          },
          { title, animates: false, visible: stopsVisibleRef.current }
        )
      );
    });
    map.addAnnotations(stopAnnotations);

    // Lo que se encuadra depende de si las paradas están visibles.
    const framedItems = () =>
      stopsVisibleRef.current ? [...pathItems, ...stopAnnotations] : pathItems;

    const padding = { top: 48, right: 48, bottom: 48, left: 48 };
    if (framedItems().length > 0) {
      map.showItems(framedItems(), { padding, animate: false });
    }

    const recenterButton = document.createElement("button");
    recenterButton.type = "button";
    recenterButton.className = styles.recenterButton;
    recenterButton.setAttribute("aria-label", "Centrar mapa en las paradas");
    recenterButton.setAttribute("title", "Centrar mapa en las paradas");

    const recenterIcon = document.createElement("span");
    recenterIcon.className = "material-symbols-rounded";
    recenterIcon.textContent = "zoom_in_map";
    recenterButton.appendChild(recenterIcon);

    recenterButton.addEventListener("click", () => {
      const framed = framedItems();
      if (framed.length > 0) map.showItems(framed, { padding, animate: true });
    });

    container.appendChild(recenterButton);

    let stopsButton: HTMLButtonElement | null = null;
    if (stopAnnotations.length > 0) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = styles.stopsButton;

      const stopsIcon = document.createElement("span");
      stopsIcon.className = "material-symbols-rounded";
      button.appendChild(stopsIcon);

      const renderStopsButton = () => {
        const visible = stopsVisibleRef.current;
        stopsIcon.textContent = visible ? "location_on" : "location_off";
        const text = visible ? "Ocultar paradas" : "Mostrar paradas";
        button.setAttribute("aria-label", text);
        button.setAttribute("title", text);
      };
      renderStopsButton();

      button.addEventListener("click", () => {
        stopsVisibleRef.current = !stopsVisibleRef.current;
        stopAnnotations.forEach((annotation) => {
          annotation.visible = stopsVisibleRef.current;
        });
        renderStopsButton();
      });

      container.appendChild(button);
      stopsButton = button;
    }

    return () => {
      stopsButton?.remove();
      recenterButton.remove();
      map.destroy();
    };
  }, [isLoaded, path, stops, color, theme, hasPath, hasStops, stopIconSrc]);

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
