"use client";

import { useState } from "react";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { RegisterBusModal } from "@/components/register_bus_modal/register_bus_modal";
import styles from "./admin_width_toggle.module.css";

export function AdminWidthToggle({ children }: { children: React.ReactNode }) {
  const [isWide, setIsWide] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const { status, empresa, signOut } = useAdminAuth();

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

            {status === "approved" && (
              <button
                type="button"
                className={styles.toggleButton}
                onClick={() => setIsWide((prev) => !prev)}
              >
                {isWide ? "Reducir ancho" : "Expandir ancho"}
              </button>
            )}

            {status === "approved" && (
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

      {showRegisterModal && (
        <RegisterBusModal
          empresa={empresa}
          onClose={() => setShowRegisterModal(false)}
        />
      )}
    </div>
  );
}
