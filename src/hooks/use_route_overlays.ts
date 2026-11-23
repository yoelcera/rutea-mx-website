"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { ROUTE_COLOR_HEX, ROUTE_STOP_ICON, type TransitRoute } from "@/data/routes";

interface RouteItems {
  polyline: MapKitJS.PolylineOverlay;
  stops: MapKitJS.Annotation[];
}

const FRAME_PADDING = { top: 48, right: 48, bottom: 48, left: 48 };

/**
 * Dibuja en un mapa MapKit el polyline (mismo estilo que el mapa de la ruta individual)
 * y las paradas de las rutas seleccionadas. Llamar DESPUÉS del efecto que crea el mapa.
 */
export function useRouteOverlays(
  mapRef: RefObject<MapKitJS.Map | null>,
  isLoaded: boolean,
  routes: TransitRoute[]
) {
  const itemsRef = useRef<Map<string, RouteItems>>(new Map());
  const routesRef = useRef(routes);
  routesRef.current = routes;
  const stopsVisibleRef = useRef(true);
  const [stopsVisible, setStopsVisible] = useState(true);
  const routesKey = routes.map((route) => route.id).join("|");

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.mapkit) return;

    const { mapkit } = window;
    const items = itemsRef.current;
    const selected = routesRef.current;
    const wanted = new Set(selected.map((route) => route.id));

    items.forEach((entry, id) => {
      if (wanted.has(id)) return;
      map.removeOverlay(entry.polyline);
      map.removeAnnotations(entry.stops);
      items.delete(id);
    });

    let added = false;
    selected.forEach((route) => {
      if (items.has(route.id)) return;

      const polyline = new mapkit.PolylineOverlay(
        route.path.map((point) => ({ latitude: point.lat, longitude: point.lng })),
        { style: new mapkit.Style({ strokeColor: ROUTE_COLOR_HEX[route.color], strokeOpacity: 1, lineWidth: 4 }) }
      );
      map.addOverlay(polyline);

      const stops = route.stops.map((stop, index) => {
        const title = stop.isTerminal ? "Inicio/Fin" : `Parada ${stop.label ?? index + 1}`;
        return new mapkit.Annotation(
          { latitude: stop.lat, longitude: stop.lng },
          () => {
            const icon = document.createElement("img");
            icon.src = ROUTE_STOP_ICON[route.color];
            icon.alt = title;
            icon.style.width = "36px";
            icon.style.height = "36px";
            return icon;
          },
          { title, animates: false, visible: stopsVisibleRef.current }
        );
      });
      map.addAnnotations(stops);

      items.set(route.id, { polyline, stops });
      added = true;
    });

    if (added) {
      const framed = [...items.values()].flatMap((entry) => [
        entry.polyline,
        ...(stopsVisibleRef.current ? entry.stops : []),
      ]);
      map.showItems(framed, { padding: FRAME_PADDING, animate: true });
    }
    // mapRef es estable; las rutas se leen de routesRef y se re-evalúan por routesKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesKey, isLoaded]);

  useEffect(() => {
    stopsVisibleRef.current = stopsVisible;
    itemsRef.current.forEach((entry) =>
      entry.stops.forEach((annotation) => {
        annotation.visible = stopsVisible;
      })
    );
  }, [stopsVisible]);

  return { stopsVisible, toggleStops: () => setStopsVisible((prev) => !prev) };
}
