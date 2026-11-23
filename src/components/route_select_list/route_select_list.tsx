"use client";

import { ROUTE_COLOR_HEX, type TransitRoute } from "@/data/routes";
import styles from "./route_select_list.module.css";

/** Lista de rutas multiseleccionable; el puntito de color identifica la empresa. */
export function RouteSelectList({
  routes,
  selected,
  onToggle,
}: {
  routes: TransitRoute[];
  selected: Set<string>;
  onToggle: (routeId: string) => void;
}) {
  return (
    <div className={styles.list}>
      {routes.map((route) => {
        const isSelected = selected.has(route.id);
        return (
          <button
            key={route.id}
            type="button"
            className={isSelected ? `${styles.item} ${styles.itemSelected}` : styles.item}
            aria-pressed={isSelected}
            onClick={() => onToggle(route.id)}
          >
            <span className={styles.dot} style={{ backgroundColor: ROUTE_COLOR_HEX[route.color] }} />
            {route.shortTitle}
          </button>
        );
      })}
    </div>
  );
}
