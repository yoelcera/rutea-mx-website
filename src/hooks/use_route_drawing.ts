"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import type { Coord, RouteDraft } from "@/lib/route_export";

const DRAW_COLOR = "#2A67BE";

export interface DrawMenu {
  x: number;
  y: number;
  coord: Coord;
}

/**
 * Modo crear: un toque en el mapa abre el menú (marker / polyline).
 * Los tramos del polyline se piden a MapKit Directions (equivalente web de MKRoute)
 * para que sigan la calle.
 */
export function useRouteDrawing(
  mapRef: RefObject<MapKitJS.Map | null>,
  isLoaded: boolean,
  draft: RouteDraft | null,
  setDraft: Dispatch<SetStateAction<RouteDraft | null>>
) {
  const [menu, setMenu] = useState<DrawMenu | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const waypointsRef = useRef<Coord[]>([]);
  const drawnRef = useRef<{
    stops: MapKitJS.Annotation[];
    line: MapKitJS.PolylineOverlay | null;
  }>({ stops: [], line: null });
  const active = draft !== null;

  // Toque en el mapa → menú de 2 botones en ese punto
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !active) return;

    const onTap = (event: { pointOnPage: { x: number; y: number } }) => {
      const rect = map.element.getBoundingClientRect();
      const coordinate = map.convertPointOnPageToCoordinate(event.pointOnPage);
      setMenu({
        x: event.pointOnPage.x - (rect.left + window.scrollX),
        y: event.pointOnPage.y - (rect.top + window.scrollY),
        coord: { lat: coordinate.latitude, lng: coordinate.longitude },
      });
    };

    map.addEventListener("single-tap", onTap);
    return () => {
      map.removeEventListener("single-tap", onTap);
      setMenu(null);
    };
  }, [active, isLoaded, mapRef]);

  // Dibujar markers y polyline según el borrador (solo se agrega lo nuevo)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.mapkit) return;
    const { mapkit } = window;
    const drawn = drawnRef.current;

    // Fuera del modo crear: se limpia todo
    if (!draft) {
      if (drawn.stops.length > 0) map.removeAnnotations(drawn.stops);
      if (drawn.line) map.removeOverlay(drawn.line);
      drawn.stops = [];
      drawn.line = null;
      return;
    }

    // Markers: solo los nuevos
    if (draft.stops.length > drawn.stops.length) {
      const fresh = draft.stops.slice(drawn.stops.length).map((stop, offset) => {
        const number = drawn.stops.length + offset + 1;
        return new mapkit.Annotation(
          { latitude: stop.lat, longitude: stop.lng },
          () => badge(String(number), 28),
          { title: `Parada ${number}`, animates: false }
        );
      });
      map.addAnnotations(fresh);
      drawn.stops = [...drawn.stops, ...fresh];
    }

    // Polyline: se crea con 2+ puntos y después solo se le actualizan los puntos
    if (draft.polyline.length > 1) {
      const points = draft.polyline.map((point) => ({ latitude: point.lat, longitude: point.lng }));
      if (drawn.line) {
        drawn.line.points = points;
      } else {
        drawn.line = new mapkit.PolylineOverlay(points, {
          style: new mapkit.Style({ strokeColor: DRAW_COLOR, strokeOpacity: 1, lineWidth: 4 }),
        });
        map.addOverlay(drawn.line);
      }
    }
  }, [draft, isLoaded, mapRef]);

  // Al salir del modo crear se limpian los puntos de paso
  useEffect(() => {
    if (!active) waypointsRef.current = [];
  }, [active]);

  const closeMenu = useCallback(() => setMenu(null), []);

  const addMarker = useCallback(() => {
    if (!menu) return;
    const coord = menu.coord;
    setDraft((prev) => (prev ? { ...prev, stops: [...prev.stops, coord] } : prev));
    setMenu(null);
  }, [menu, setDraft]);

  const addPolylinePoint = useCallback(() => {
    if (!menu || !window.mapkit || !draft) return;
    const target = menu.coord;
    const previous = waypointsRef.current[waypointsRef.current.length - 1];
    waypointsRef.current = [...waypointsRef.current, target];
    setMenu(null);

    if (!previous) return; // primer punto: solo queda como inicio, sin marker

    const { mapkit } = window;
    new mapkit.Directions().route(
      {
        origin: { latitude: previous.lat, longitude: previous.lng },
        destination: { latitude: target.lat, longitude: target.lng },
        transportType:
          draft.kind === "walk"
            ? mapkit.Directions.Transport.Walking
            : mapkit.Directions.Transport.Automobile,
      },
      (error, response) => {
        const route = response?.routes?.[0];
        if (error || !route) {
          console.error("Directions:", error);
          waypointsRef.current = waypointsRef.current.filter((point) => point !== target);
          setNotice(`No se encontró ruta por calle${error?.message ? `: ${error.message}` : "."}`);
          setTimeout(() => setNotice(null), 4000);
          return;
        }

        const raw = route.path?.flat() ?? route.polyline?.points ?? [];
        const coords = raw.map((c) => ({ lat: c.latitude, lng: c.longitude }));
        setDraft((prev) => {
          if (!prev) return prev;
          const last = prev.polyline[prev.polyline.length - 1];
          const repeatsLast =
            last && coords[0] && last.lat === coords[0].lat && last.lng === coords[0].lng;
          return {
            ...prev,
            polyline: [...prev.polyline, ...(repeatsLast ? coords.slice(1) : coords)],
          };
        });
      }
    );
  }, [menu, draft, setDraft]);

  return { menu, notice, closeMenu, addMarker, addPolylinePoint };
}

function badge(text: string, size: number): HTMLElement {
  const element = document.createElement("div");
  element.textContent = text;
  element.style.cssText =
    `width:${size}px;height:${size}px;border-radius:50%;background:${DRAW_COLOR};color:#fff;` +
    "display:flex;align-items:center;justify-content:center;font:600 12px system-ui;border:2px solid #fff;";
  return element;
}
