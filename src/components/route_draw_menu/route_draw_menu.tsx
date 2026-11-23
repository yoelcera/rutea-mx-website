"use client";

import { Icon } from "@/components/icon/icon";
import styles from "./route_draw_menu.module.css";

export function RouteDrawMenu({
  x,
  y,
  onMarker,
  onPolyline,
  onClose,
}: {
  x: number;
  y: number;
  onMarker: () => void;
  onPolyline: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className={styles.catcher} onClick={onClose} />
      <div className={styles.menu} style={{ left: x, top: y }}>
        <button
          type="button"
          className={styles.button}
          style={{ "--i": 0 } as React.CSSProperties}
          aria-label="Agregar marker"
          title="Marker"
          onClick={onMarker}
        >
          <Icon name="location_on" size={20} />
        </button>
        <button
          type="button"
          className={styles.button}
          style={{ "--i": 1 } as React.CSSProperties}
          aria-label="Agregar polyline"
          title="Polyline"
          onClick={onPolyline}
        >
          <Icon name="polyline" size={20} />
        </button>
      </div>
    </>
  );
}
