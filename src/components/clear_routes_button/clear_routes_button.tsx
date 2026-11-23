"use client";

import styles from "./clear_routes_button.module.css";

export function ClearRoutesButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={className ?? styles.floating}
      aria-label="Deseleccionar rutas"
      title="Deseleccionar rutas"
      onClick={onClick}
    >
      <span className={`material-symbols-rounded ${styles.icon}`}>close</span>
    </button>
  );
}
