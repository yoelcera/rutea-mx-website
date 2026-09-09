"use client";

import { useState } from "react";
import { AuthModal } from "@/components/auth_modal/auth_modal";
import { BusMapMapKit } from "@/components/bus_map_mapkit/bus_map_mapkit";
import {
  getOperatorBySlug,
  getOperatorSlugByEmpresa,
  getRoutesByOperator,
  ROUTE_COLOR_HEX,
  ROUTE_COLOR_TEXT,
} from "@/data/routes";
import { BusQrPanel } from "@/components/bus_qr_panel/bus_qr_panel";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { isBusActive, useLiveBuses } from "@/hooks/use_live_buses";
import { isFirebaseConfigured } from "@/lib/firebase";
import styles from "./admin_gate.module.css";

const DEFAULT_CHIP_COLOR = "#000000";
const DEFAULT_CHIP_TEXT_COLOR = "#FFFFFF";

export function AdminGateContent() {
  if (!isFirebaseConfigured) {
    return (
      <div className={styles.gate}>
        <p className={styles.message}>
          Configura las variables NEXT_PUBLIC_FIREBASE_* en .env.local para habilitar el acceso.
        </p>
      </div>
    );
  }

  return <AdminGateInner />;
}

function AdminGateInner() {
  const { user, nombre, empresa, status, loading, signOut } = useAdminAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const buses = useLiveBuses(empresa);

  if (loading) {
    return (
      <div className={styles.gate}>
        <p className={styles.message}>Cargando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.gate}>
        <button type="button" className={styles.loginButton} onClick={() => setShowModal(true)}>
          Iniciar sesión / Crear cuenta
        </button>
        {showModal && <AuthModal onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className={`${styles.gate} ${styles.messageBlock}`}>
        <p className={styles.message}>Tu cuenta está pendiente de aprobación.</p>
        <button type="button" className={styles.signOutButton} onClick={signOut}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  if (status === "revoked" || status === "none") {
    return (
      <div className={`${styles.gate} ${styles.messageBlock}`}>
        <p className={styles.deniedMessage}>No tienes acceso a este panel.</p>
        <button type="button" className={styles.signOutButton} onClick={signOut}>
          Cerrar sesión
        </button>
      </div>
    );
  }

  const firstName = nombre?.trim().split(/\s+/)[0];
  const operatorSlug = empresa ? getOperatorSlugByEmpresa(empresa) : undefined;
  const operator = operatorSlug ? getOperatorBySlug(operatorSlug) : undefined;
  const routes = operatorSlug ? getRoutesByOperator(operatorSlug) : [];
  const chipColor = routes[0] ? ROUTE_COLOR_HEX[routes[0].color] : DEFAULT_CHIP_COLOR;
  const chipTextColor = routes[0] ? ROUTE_COLOR_TEXT[routes[0].color] : DEFAULT_CHIP_TEXT_COLOR;
  const totalPassengers = buses.filter(isBusActive).reduce((sum, bus) => sum + bus.passengersCount, 0);
  const activeDrivers = buses.filter(isBusActive).filter((bus) => Boolean(bus.driverId)).length;
  const selectedBus = buses.find((bus) => bus.id === selectedBusId) ?? null;

  return (
    <div className={`${styles.gate} ${styles.messageBlock}`}>
      <div className={styles.statsRow}>
        <p className={styles.message}>
          Bienvenido{firstName ? `, ${firstName}` : ""}.
        </p>
        <p className={styles.message}>Empresa: {operator?.name ?? empresa}</p>
        <p className={styles.message}>Choferes activos: {activeDrivers}</p>
        <p className={styles.message}>Pasajeros totales: {totalPassengers}</p>
      </div>
      <div className={styles.busRosterRow}>
        <p className={styles.message}>Buses:</p>
        <div className={styles.busRoster}>
        {buses.map((bus) => (
          <button
            key={bus.id}
            type="button"
            className={
              selectedBusId === bus.id
                ? `${styles.busChip} ${styles.busChipSelected}`
                : styles.busChip
            }
            style={
              bus.driverName.trim()
                ? { backgroundColor: chipColor, color: chipTextColor }
                : undefined
            }
            onClick={() =>
              setSelectedBusId((prev) => (prev === bus.id ? null : bus.id))
            }
          >
            {bus.unidad}
          </button>
        ))}
        </div>
      </div>
      {selectedBus && (
        <div className={styles.busDetails}>
          <div className={styles.busDetailsInfo}>
            <p className={styles.busDetailRow}>
              <strong>Bus ID:</strong> {selectedBus.busId}
            </p>
            <p className={styles.busDetailRow}>
              <strong>Placas:</strong> {selectedBus.plate}
            </p>
            <p className={styles.busDetailRow}>
              <strong>Conductor:</strong> {selectedBus.driverName}
            </p>
            <p className={styles.busDetailRow}>
              <strong>Ubicación:</strong>{" "}
              {selectedBus.lat !== null && selectedBus.lng !== null
                ? `${selectedBus.lat.toFixed(5)}, ${selectedBus.lng.toFixed(5)}`
                : "—"}
            </p>
            <p className={styles.busDetailRow}>
              <strong>Actualizado:</strong>{" "}
              {selectedBus.updatedAt ? selectedBus.updatedAt.toLocaleString("es-MX") : "—"}
            </p>
            <p className={styles.busDetailRow}>
              <strong>Ruta ID:</strong> {selectedBus.routeId}
            </p>
            <p className={styles.busDetailRow}>
              <strong>Pasajeros:</strong> {selectedBus.passengersCount}
            </p>
          </div>

          <BusQrPanel
            busDocId={selectedBus.id}
            busId={selectedBus.busId}
            qrGenerated={selectedBus.qrGenerated}
          />
        </div>
      )}
      {empresa && <BusMapMapKit empresa={empresa} buses={buses} />}
    </div>
  );
}
