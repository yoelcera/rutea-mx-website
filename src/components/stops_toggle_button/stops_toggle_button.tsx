"use client";

import styles from "./stops_toggle_button.module.css";

/** Mismo botón que "Ocultar paradas" del mapa de la ruta individual. */
export function StopsToggleButton({
  visible,
  onClick,
  className,
}: {
  visible: boolean;
  onClick: () => void;
  className?: string;
}) {
  const label = visible ? "Ocultar paradas" : "Mostrar paradas";

  return (
    <button
      type="button"
      className={className ?? styles.floating}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <span className={`material-symbols-rounded ${styles.icon}`}>
        {visible ? "location_on" : "location_off"}
      </span>
    </button>
  );
}
