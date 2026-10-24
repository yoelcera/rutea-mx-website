"use client";

import { useEffect, useRef } from "react";
import {
  getOperatorSlugByEmpresa,
  getRoutesByOperator,
  ROUTE_COLOR_HEX,
  TRANSIT_ROUTES,
} from "@/data/routes";
import { useTheme } from "@/hooks/useTheme";
import { useMapKitScript } from "@/hooks/use_mapkit_script";
import { hasAssignedDriver } from "@/hooks/use_live_buses";
import { hasActiveBikeRide, type MasterBike, type MasterBus } from "@/hooks/use_master_data";
import { regionFromPoints } from "@/lib/mapkit_region";
import busStyles from "@/components/bus_map_mapkit/bus_map_mapkit.module.css";
import bikeStyles from "@/components/bike_map_mapkit/bike_map_mapkit.module.css";
import styles from "./master_map_mapkit.module.css";

const MAPKIT_TOKEN = process.env.NEXT_PUBLIC_MAPKIT_TOKEN ?? "";
const DEFAULT_PIN_COLOR = "#000000";

type PinKind = "bus" | "bike";

interface Pin {
  key: string;
  kind: PinKind;
  lat: number;
  lng: number;
  label: string;
  color: string;
}

/** Color de la empresa (el de su primera ruta), igual que en los mapas por empresa. */
function empresaColor(empresa: string): string {
  const operatorSlug = getOperatorSlugByEmpresa(empresa) ?? empresa;
  const route = getRoutesByOperator(operatorSlug)[0];
  return route ? ROUTE_COLOR_HEX[route.color] : DEFAULT_PIN_COLOR;
}

/** Mismo pin que BusMapMapKit / BikeMapMapKit, reutilizando sus estilos. */
function buildPinElement(pin: Pin): HTMLElement {
  const s =
    pin.kind === "bus"
      ? { pin: busStyles.busPin, circle: busStyles.busCircle, icon: busStyles.busIcon, label: busStyles.busLabel }
      : { pin: bikeStyles.bikePin, circle: bikeStyles.bikeCircle, icon: bikeStyles.bikeIcon, label: bikeStyles.bikeLabel };

  const content = document.createElement("div");
  content.className = s.pin;

  const circle = document.createElement("span");
  circle.className = s.circle;
  circle.style.backgroundColor = pin.color;

  const icon = document.createElement("span");
  icon.className = s.icon;
  circle.appendChild(icon);
  content.appendChild(circle);

  const labelEl = document.createElement("span");
  labelEl.className = s.label;
  labelEl.dataset.pinLabel = "true";
  labelEl.textContent = pin.label;
  content.appendChild(labelEl);

  return content;
}

interface MasterMapProps {
  buses: MasterBus[];
  bikes: MasterBike[];
  showBuses: boolean;
  showBikes: boolean;
  onToggleBuses: () => void;
  onToggleBikes: () => void;
  height?: number;
}

/** Mapa de la cuenta maestra: buses con chofer + bicis en ride, de todas las empresas. */
export function MasterMapMapKit({
  buses,
  bikes,
  showBuses,
  showBikes,
  onToggleBuses,
  onToggleBikes,
  height = 420,
}: MasterMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapKitJS.Map | null>(null);
  const markersRef = useRef<Map<string, MapKitJS.Annotation>>(new Map());
  const previousPinsCountRef = useRef<number | null>(null);
  const theme = useTheme();
  const { isLoaded, error } = useMapKitScript(MAPKIT_TOKEN);

  const pins: Pin[] = [
    ...(showBuses
      ? buses.flatMap((bus): Pin[] => {
          if (!hasAssignedDriver(bus)) return [];
          const firstName = bus.driverName.trim().split(/\s+/)[0] ?? "";
          return [
            {
              key: `bus:${bus.id}`,
              kind: "bus",
              lat: bus.lat,
              lng: bus.lng,
              label: [firstName, bus.unidad].filter(Boolean).join(" "),
              color: empresaColor(bus.empresa),
            },
          ];
        })
      : []),
    ...(showBikes
      ? bikes.flatMap((bike): Pin[] => {
          if (!hasActiveBikeRide(bike) || !bike.riderLocation) return [];
          return [
            {
              key: `bike:${bike.id}`,
              kind: "bike",
              lat: bike.riderLocation.lat,
              lng: bike.riderLocation.lng,
              label: bike.number,
              color: empresaColor(bike.operator),
            },
          ];
        })
      : []),
  ];

  // Crear el mapa una sola vez, encuadrando todas las rutas
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || mapRef.current || !window.mapkit) return;

    const { mapkit } = window;
    const points = TRANSIT_ROUTES.flatMap((route) => [
      ...route.path,
      ...route.stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
    ]);

    const map = new mapkit.Map(mapContainerRef.current, {
      colorScheme: theme === "dark" ? mapkit.ColorScheme.Dark : mapkit.ColorScheme.Light,
      region: regionFromPoints(points),
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
    // Igual que los otros mapas: se crea una sola vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  // Mover / agregar / quitar pines
  useEffect(() => {
    if (!mapRef.current || !window.mapkit) return;

    const { mapkit } = window;
    const map = mapRef.current;
    const markers = markersRef.current;
    const pinKeys = new Set(pins.map((pin) => pin.key));

    markers.forEach((marker, key) => {
      if (!pinKeys.has(key)) {
        map.removeAnnotation(marker);
        markers.delete(key);
      }
    });

    pins.forEach((pin) => {
      const coordinate = { latitude: pin.lat, longitude: pin.lng };
      const existing = markers.get(pin.key);

      if (existing) {
        existing.coordinate = coordinate;
        existing.title = pin.label;
        const labelEl = existing.element.querySelector<HTMLElement>("[data-pin-label]");
        if (labelEl) labelEl.textContent = pin.label;
        return;
      }

      const marker = new mapkit.Annotation(coordinate, () => buildPinElement(pin), {
        title: pin.label,
      });
      map.addAnnotation(marker);
      markers.set(pin.key, marker);
    });

    if (pins.length > 0 && pins.length !== previousPinsCountRef.current) {
      previousPinsCountRef.current = pins.length;
      map.setRegionAnimated(regionFromPoints(pins), true);
    }
  }, [pins]);

  // Limpiar pines al desmontar
  useEffect(() => {
    const markers = markersRef.current;
    return () => {
      markers.forEach((marker) => mapRef.current?.removeAnnotation(marker));
      markers.clear();
    };
  }, []);

  let content;
  if (!MAPKIT_TOKEN) {
    content = (
      <div className={busStyles.placeholder} style={{ height }}>
        Configura NEXT_PUBLIC_MAPKIT_TOKEN para ver el mapa.
      </div>
    );
  } else if (error) {
    content = (
      <div className={busStyles.placeholder} style={{ height }}>
        {error.message}
      </div>
    );
  } else {
    content = <div ref={mapContainerRef} className={busStyles.map} style={{ height }} />;
  }

  return (
    <div className={styles.wrapper}>
      {content}

      <div className={styles.toggles}>
        <button
          type="button"
          className={showBuses ? styles.toggle : `${styles.toggle} ${styles.toggleOff}`}
          aria-pressed={showBuses}
          aria-label={showBuses ? "Ocultar buses" : "Mostrar buses"}
          title={showBuses ? "Ocultar buses" : "Mostrar buses"}
          onClick={onToggleBuses}
        >
          <span className={`${styles.toggleIcon} ${styles.busIcon}`} />
        </button>
        <button
          type="button"
          className={showBikes ? styles.toggle : `${styles.toggle} ${styles.toggleOff}`}
          aria-pressed={showBikes}
          aria-label={showBikes ? "Ocultar bicis" : "Mostrar bicis"}
          title={showBikes ? "Ocultar bicis" : "Mostrar bicis"}
          onClick={onToggleBikes}
        >
          <span className={`${styles.toggleIcon} ${styles.bikeIcon}`} />
        </button>
      </div>
    </div>
  );
}
