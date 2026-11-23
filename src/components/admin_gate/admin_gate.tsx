"use client";

import { useMemo, useState } from "react";
import { AdminMapStage } from "@/components/admin_map_stage/admin_map_stage";
import { AuthModal } from "@/components/auth_modal/auth_modal";
import { BusMapMapKit } from "@/components/bus_map_mapkit/bus_map_mapkit";
import {
  getOperatorBySlug,
  getOperatorSlugByEmpresa,
  getRoutesByOperator,
  MOBILITY_ROSTER_LABEL,
  MobilityType,
  ROUTE_COLOR_HEX,
  ROUTE_COLOR_TEXT,
} from "@/data/routes";
import { RouteSelectList } from "@/components/route_select_list/route_select_list";
import { BikeDetails } from "@/components/bike_details/bike_details";
import { BikeQrPanel } from "@/components/bike_qr_panel/bike_qr_panel";
import { BusQrPanel } from "@/components/bus_qr_panel/bus_qr_panel";
import { MasterPanel } from "@/components/master_panel/master_panel";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { useBackfillBusImis } from "@/hooks/use_backfill_bus_imis";
import { useLinkedBikesCount } from "@/hooks/use_linked_bikes_count";
import { BikeMapMapKit } from "@/components/bike_map_mapkit/bike_map_mapkit";
import { hasActiveRide, useLiveBikes } from "@/hooks/use_live_bikes";
import { isBusActive, useLiveBuses } from "@/hooks/use_live_buses";
import { isFirebaseConfigured } from "@/lib/firebase";
import { buildBusImi } from "@/lib/imi";
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
  const { user, nombre, empresa, mobilityType, status, isMaster, loading, signOut } = useAdminAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedRouteIds, setSelectedRouteIds] = useState<Set<string>>(new Set());
  const isBike = mobilityType === MobilityType.Bike;
  const buses = useLiveBuses(isBike ? null : empresa);
  // Buses sin IMI: se les genera y guarda automático
  const busesForImi = useMemo(
    () => buses.map((bus) => ({ ...bus, empresa: empresa ?? "" })),
    [buses, empresa]
  );
  useBackfillBusImis(busesForImi);
  const bikes = useLiveBikes(empresa, isBike);
  const totalCyclists = useLinkedBikesCount(empresa, isBike);

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

  if (isMaster) {
    return <MasterPanel />;
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
  const selectedRoutes = routes.filter((route) => selectedRouteIds.has(route.id));

  function toggleRoute(routeId: string) {
    setSelectedRouteIds((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  }
  const chipColor = routes[0] ? ROUTE_COLOR_HEX[routes[0].color] : DEFAULT_CHIP_COLOR;
  const chipTextColor = routes[0] ? ROUTE_COLOR_TEXT[routes[0].color] : DEFAULT_CHIP_TEXT_COLOR;
  const totalPassengers = buses.filter(isBusActive).reduce((sum, bus) => sum + bus.passengersCount, 0);
  const activeDrivers = buses.filter(isBusActive).filter((bus) => Boolean(bus.driverId)).length;
  const selectedBus = buses.find((bus) => bus.id === selectedBusId) ?? null;
  const selectedBike = isBike ? bikes.find((bike) => bike.id === selectedBusId) ?? null : null;

  return (
    <AdminMapStage
      renderMap={(insetLeft) =>
        empresa ? (
          isBike ? (
            <BikeMapMapKit
              empresa={empresa}
              bikes={bikes}
              insetLeft={insetLeft}
              selectedRoutes={selectedRoutes}
              onClearRoutes={() => setSelectedRouteIds(new Set())}
            />
          ) : (
            <BusMapMapKit
              empresa={empresa}
              buses={buses}
              insetLeft={insetLeft}
              selectedRoutes={selectedRoutes}
              onClearRoutes={() => setSelectedRouteIds(new Set())}
            />
          )
        ) : null
      }
      panel={
        <>
              <div className={styles.statsRow}>
                <p className={styles.message}>
                  Bienvenido{firstName ? `, ${firstName}` : ""}.
                </p>
                <p className={styles.message}>Empresa: {operator?.name ?? empresa}</p>
                {isBike ? (
                  <p className={styles.message}>Ciclistas totales: {totalCyclists}</p>
                ) : (
                  <>
                    <p className={styles.message}>Choferes activos: {activeDrivers}</p>
                    <p className={styles.message}>Pasajeros totales: {totalPassengers}</p>
                  </>
                )}
              </div>
              <div className={styles.busRosterRow}>
                <p className={styles.message}>{MOBILITY_ROSTER_LABEL[mobilityType]}</p>
                <div className={styles.busRoster}>
                {isBike
                  ? bikes.map((bike) => (
                      <button
                        key={bike.id}
                        type="button"
                        className={
                          selectedBusId === bike.id
                            ? `${styles.busChip} ${styles.busChipSelected}`
                            : styles.busChip
                        }
                        style={
                          hasActiveRide(bike)
                            ? { backgroundColor: chipColor, color: chipTextColor }
                            : undefined
                        }
                        onClick={() =>
                          setSelectedBusId((prev) => (prev === bike.id ? null : bike.id))
                        }
                      >
                        {bike.number}
                      </button>
                    ))
                  : buses.map((bus) => (
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
              {routes.length > 0 && (
                <div className={styles.routesBlock}>
                  <p className={styles.message}>Rutas</p>
                  <RouteSelectList routes={routes} selected={selectedRouteIds} onToggle={toggleRoute} />
                </div>
              )}
              {selectedBus && (
                <div className={styles.busDetails}>
                  <div className={styles.busDetailsInfo}>
                    <p className={styles.busDetailRow}>
                      <strong>Bus ID:</strong> {selectedBus.busId}
                    </p>
                    <p className={styles.busDetailRow}>
                      <strong>IMI:</strong>{" "}
                      {selectedBus.imi || buildBusImi(empresa ?? "", selectedBus.unidad)}
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
                    unidad={selectedBus.unidad}
                    empresaName={operator?.name ?? empresa ?? ""}
                  />
                </div>
              )}
              {selectedBike && (
                <div className={styles.busDetails}>
                  <BikeDetails key={selectedBike.id} bike={selectedBike} />

                  <BikeQrPanel
                    bikeId={selectedBike.id}
                    qrGenerated={selectedBike.qr_generated}
                    number={selectedBike.number}
                    empresa={empresa ?? ""}
                    empresaName={operator?.name ?? empresa ?? ""}
                  />
                </div>
              )}
        </>
      }
    />
  );
}
