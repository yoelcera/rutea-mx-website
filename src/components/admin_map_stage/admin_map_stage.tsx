"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useAdminPanel } from "@/hooks/use_admin_panel";
import styles from "./admin_map_stage.module.css";

/**
 * Mapa siempre visible con un panel flotante encima (lado izquierdo).
 * El panel queda montado aunque esté cerrado, para conservar lo último leído.
 */
export function AdminMapStage({
  panel,
  renderMap,
}: {
  panel: React.ReactNode;
  renderMap: (insetLeft: number) => React.ReactNode;
}) {
  const { open } = useAdminPanel();
  const panelRef = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState(0);

  useLayoutEffect(() => {
    setInset(open && panelRef.current ? panelRef.current.offsetWidth + 24 : 0);
  }, [open]);

  return (
    <div className={styles.stage}>
      {renderMap(inset)}
      <div
        ref={panelRef}
        className={open ? `${styles.panel} ${styles.panelOpen}` : styles.panel}
        aria-hidden={!open}
      >
        <div className={styles.content}>{panel}</div>
      </div>
    </div>
  );
}
