"use client";

import { useState } from "react";
import styles from "./admin_width_toggle.module.css";

export function AdminWidthToggle({ children }: { children: React.ReactNode }) {
  const [isWide, setIsWide] = useState(false);

  return (
    <div className={styles.outer}>
      <div className={isWide ? styles.wide : styles.narrow}>
        <div className={styles.header}>
          <h2 className={styles.title}>Panel de Administrador</h2>
          <button
            type="button"
            className={styles.toggleButton}
            onClick={() => setIsWide((prev) => !prev)}
          >
            {isWide ? "Reducir ancho" : "Expandir ancho"}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
