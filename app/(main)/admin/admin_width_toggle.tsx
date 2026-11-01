"use client";

import { useState } from "react";
import { Icon } from "@/components/icon/icon";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { useMasterStore } from "@/hooks/use_master_store";
import { RegisterBikeModal } from "@/components/register_bike_modal/register_bike_modal";
import { RegisterBusModal } from "@/components/register_bus_modal/register_bus_modal";
import { MobilityType } from "@/data/routes";
import styles from "./admin_width_toggle.module.css";

export function AdminWidthToggle({ children }: { children: React.ReactNode }) {
  const [isWide, setIsWide] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { status, isMaster, empresa, mobilityType, signOut } = useAdminAuth();
  const { listenersOn, setListenersOn } = useMasterStore();

  function renderRegisterModal() {
    const close = () => setShowRegisterModal(false);

    switch (mobilityType) {
      case MobilityType.Bus:
        return <RegisterBusModal empresa={empresa} onClose={close} />;
      case MobilityType.Bike:
        return <RegisterBikeModal empresa={empresa} onClose={close} />;
    }
  }

  return (
    <div className={styles.outer}>
      <div className={isWide ? styles.wide : styles.narrow}>
        <div className={styles.header}>
          <h2 className={styles.title}>Panel de Administrador</h2>
          <div className={styles.buttonRow}>
            {status === "approved" && (
              <button
                type="button"
                className={styles.toggleButton}
                onClick={signOut}
              >
                Cerrar sesión
              </button>
            )}

            {isMaster && (
              <button
                type="button"
                className={`${styles.toggleButton} ${styles.iconButton}`}
                onClick={() => setListenersOn((prev) => !prev)}
                aria-pressed={listenersOn}
                title={listenersOn ? "Listeners activos" : "Listeners solo con secciones abiertas"}
              >
                Listeners
                <Icon name={listenersOn ? "check" : "close"} size={18} />
              </button>
            )}

            {status === "approved" && (
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setIsWide((prev) => !prev)}
              >
                {isWide ? "Reducir ancho" : "Expandir ancho"}
              </button>
            )}

            {status === "approved" && !isMaster && (
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setShowRegisterModal(true)}
              >
                Registrar unidad
              </button>
            )}
          </div>
        </div>

        {children}
      </div>

      {showRegisterModal && renderRegisterModal()}
    </div>
  );
}
