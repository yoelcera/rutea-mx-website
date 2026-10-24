"use client";

import { useState, type ReactNode } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { EMPRESA_OPTIONS } from "@/components/auth_modal/auth_modal";
import { BikeQrPanel } from "@/components/bike_qr_panel/bike_qr_panel";
import { BusQrPanel } from "@/components/bus_qr_panel/bus_qr_panel";
import { Icon } from "@/components/icon/icon";
import { MasterMapMapKit } from "@/components/master_map_mapkit/master_map_mapkit";
import { RegisterBikeModal } from "@/components/register_bike_modal/register_bike_modal";
import { RegisterBusModal } from "@/components/register_bus_modal/register_bus_modal";
import { BIKE_STATUS_LABEL, BikeStatus } from "@/data/bike_types";
import { MobilityType, TRANSIT_ROUTES } from "@/data/routes";
import { useAdminAuth } from "@/hooks/use_admin_auth";
import { isBusActive } from "@/hooks/use_live_buses";
import {
  hasActiveBikeRide,
  useMasterAdmins,
  useMasterBikes,
  useMasterBuses,
  useStaleTick,
  type MasterAdmin,
  type MasterBike,
  type MasterBus,
} from "@/hooks/use_master_data";
import { db } from "@/lib/firebase";
import gateStyles from "@/components/admin_gate/admin_gate.module.css";
import styles from "./master_panel.module.css";

type EmpresaOption = (typeof EMPRESA_OPTIONS)[number];

// Sin botón "Pendiente": a pendiente solo se regresa desde la consola de Firebase
const STATUS_ACTIONS: { value: "approved" | "revoked"; label: string }[] = [
  { value: "approved", label: "Aprobar" },
  { value: "revoked", label: "Revocar" },
];

const STATUS_LABEL: Record<string, string> = {
  approved: "Aprobado",
  pending: "Pendiente",
  revoked: "Revocado",
  none: "Sin estado",
};

/** Etiqueta de status: solo fondo de color, sin borde. */
const STATUS_TAG_CLASS: Record<string, string> = {
  approved: styles.tagApproved,
  pending: styles.tagPending,
  revoked: styles.tagRevoked,
};

/** Estados que se pueden asignar a mano a una bici ("unknown" no). */
const BIKE_STATUS_OPTIONS = Object.values(BikeStatus).filter(
  (status) => status !== BikeStatus.Unknown
);

function routeName(routeId: string): string {
  return TRANSIT_ROUTES.find((route) => route.id === routeId)?.name ?? (routeId || "—");
}

function empresaName(empresa: string | null): string {
  return EMPRESA_OPTIONS.find((option) => option.empresa === empresa)?.name ?? empresa ?? "—";
}

/** "—" mientras la lista no se ha abierto nunca; si no, el número. */
function countLabel(list: unknown[] | null, value?: number): string {
  if (list === null) return "—";
  return String(value ?? list.length);
}

// ---------------------------------------------------------------------------
// Lista colapsable: solo lee mientras está abierta
// ---------------------------------------------------------------------------

function Section({
  title,
  count,
  open,
  onToggle,
  nested = false,
  children,
}: {
  title: string;
  count: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  nested?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className={nested ? `${styles.section} ${styles.nested}` : styles.section}
      open={open}
      onToggle={(event) => onToggle(event.currentTarget.open)}
    >
      <summary className={styles.summary}>
        <span className={styles.summaryTitle}>
          <span className={styles.chevron}>›</span>
          {title}
        </span>
        <span className={styles.count}>{count}</span>
      </summary>
      <div className={styles.sectionBody}>{children}</div>
    </details>
  );
}

function Empty({ list }: { list: unknown[] | null }) {
  if (list === null) return <p className={styles.empty}>Cargando...</p>;
  if (list.length === 0) return <p className={styles.empty}>Sin registros.</p>;
  return null;
}

// ---------------------------------------------------------------------------
// Acciones (status / eliminar) — cada fila maneja su propio "cargando" y error
// ---------------------------------------------------------------------------

function useRowAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    if (!db) return;
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run };
}

function StatusTag({ status }: { status: string }) {
  return (
    <span className={`${styles.statusTag} ${STATUS_TAG_CLASS[status] ?? ""}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function StatusButtons({
  current,
  disabled,
  onChange,
}: {
  current: string;
  disabled: boolean;
  onChange: (status: string) => void;
}) {
  return (
    <div className={styles.actions}>
      {STATUS_ACTIONS.map((action) => (
        <button
          key={action.value}
          type="button"
          className={
            current === action.value
              ? `${gateStyles.detailButton} ${styles.activeButton}`
              : gateStyles.detailButton
          }
          disabled={disabled || current === action.value}
          onClick={() => onChange(action.value)}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

function AdminRow({ admin, isSelf }: { admin: MasterAdmin; isSelf: boolean }) {
  const { busy, error, run } = useRowAction();

  return (
    <div className={styles.row}>
      <div className={styles.rowInfo}>
        <p className={styles.rowTitle}>
          {admin.nombre || "Sin nombre"}
          {admin.master && <span className={styles.masterTag}>Maestra</span>}
          <StatusTag status={admin.status} />
        </p>
        <p className={styles.rowMeta}>
          {admin.correo || "—"} · {empresaName(admin.empresa)}
        </p>
        {error && <p className={gateStyles.deniedMessage}>{error}</p>}
      </div>
      {/* No te puedes cambiar el status a ti mismo, para no quedarte fuera */}
      <StatusButtons
        current={admin.status}
        disabled={busy || isSelf}
        onChange={(status) =>
          run(() => updateDoc(doc(db!, "admins", admin.id), { status, updated_at: serverTimestamp() }))
        }
      />
    </div>
  );
}

function BusRow({ bus, showEmpresa = false }: { bus: MasterBus; showEmpresa?: boolean }) {
  const { busy, error, run } = useRowAction();

  return (
    <div className={styles.unitRow}>
      <div className={styles.rowInfo}>
        <p className={styles.rowTitle}>
          Unidad {bus.unidad || "—"}
          <StatusTag status={bus.status} />
        </p>
        <p className={styles.rowMeta}>
          {showEmpresa && `${empresaName(bus.empresa)} · `}
          Placas: {bus.plate || "—"} · Ruta: {routeName(bus.routeId)} · Chofer:{" "}
          {bus.driverName || "—"} · Pasajeros: {bus.passengersCount}
        </p>
        {error && <p className={gateStyles.deniedMessage}>{error}</p>}
        {/* En buses no se toca updated_at: marca la última ubicación del chofer */}
        <StatusButtons
          current={bus.status}
          disabled={busy}
          onChange={(status) => run(() => updateDoc(doc(db!, "buses", bus.id), { status }))}
        />
      </div>
      {/* Mismo QR / Eliminar / Descargar que el panel normal, con botones de borde */}
      <BusQrPanel
        busDocId={bus.id}
        busId={bus.busId}
        qrGenerated={bus.qrGenerated}
        unidad={bus.unidad}
        empresaName={empresaName(bus.empresa)}
        compact
      />
    </div>
  );
}

function BikeRow({ bike, showEmpresa = false }: { bike: MasterBike; showEmpresa?: boolean }) {
  const { busy, error, run } = useRowAction();

  return (
    <div className={styles.unitRow}>
      <div className={styles.rowInfo}>
        <p className={styles.rowTitle}>
          Bici {bike.number || "—"}
          <span className={styles.statusTag}>{BIKE_STATUS_LABEL[bike.status]}</span>
          {/* Flechita separada de la etiqueta; el <select> real va invisible encima y abre el menú nativo */}
          <label className={styles.statusSelect} title="Cambiar estado">
            <Icon name="expand_more" size={14} />
            <select
              className={styles.statusSelectInput}
              aria-label="Cambiar estado de la bici"
              value={bike.status}
              disabled={busy}
              onChange={(event) =>
                run(() =>
                  updateDoc(doc(db!, "bikes", bike.id), {
                    status: event.target.value,
                    updated_at: serverTimestamp(),
                  })
                )
              }
            >
              {bike.status === BikeStatus.Unknown && (
                <option value={BikeStatus.Unknown}>{BIKE_STATUS_LABEL[BikeStatus.Unknown]}</option>
              )}
              {BIKE_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {BIKE_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
        </p>
        <p className={styles.rowMeta}>
          {showEmpresa && `${empresaName(bike.operator)} · `}
          IMI: {bike.imi || "—"} · Ciclista: {bike.riderId ?? "—"}
        </p>
        {error && <p className={gateStyles.deniedMessage}>{error}</p>}
      </div>
      {/* Mismo QR / Eliminar / Descargar que el panel normal, con botones de borde */}
      <BikeQrPanel
        bikeId={bike.id}
        qrGenerated={bike.qrGenerated}
        number={bike.number}
        empresa={bike.operator}
        empresaName={empresaName(bike.operator)}
        compact
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Secciones
// ---------------------------------------------------------------------------

function ActiveDriversSection() {
  const [open, setOpen] = useState(false);
  const buses = useMasterBuses(open, { onlyApproved: true });
  const bikes = useMasterBikes(open);
  useStaleTick();

  const drivers = buses?.filter((bus) => Boolean(bus.driverId) && isBusActive(bus)) ?? [];
  const riders = bikes?.filter(hasActiveBikeRide) ?? [];
  const loaded = buses === null || bikes === null ? null : [...drivers, ...riders];

  return (
    <Section title="Conductores activos" count={countLabel(loaded)} open={open} onToggle={setOpen}>
      <Empty list={loaded} />
      {drivers.map((bus) => (
        <div key={bus.id} className={styles.row}>
          <div className={styles.rowInfo}>
            <p className={styles.rowTitle}>{bus.driverName || "Chofer sin nombre"}</p>
            <p className={styles.rowMeta}>
              Chofer · {empresaName(bus.empresa)} · Unidad {bus.unidad} · {routeName(bus.routeId)}
            </p>
          </div>
        </div>
      ))}
      {riders.map((bike) => (
        <div key={bike.id} className={styles.row}>
          <div className={styles.rowInfo}>
            <p className={styles.rowTitle}>{bike.riderId ?? "Ciclista"}</p>
            <p className={styles.rowMeta}>
              Ciclista · {empresaName(bike.operator)} · Bici {bike.number}
            </p>
          </div>
        </div>
      ))}
    </Section>
  );
}

function PassengersSection() {
  const [open, setOpen] = useState(false);
  const buses = useMasterBuses(open, { onlyApproved: true });
  useStaleTick();

  const withPassengers =
    buses?.filter((bus) => isBusActive(bus) && bus.passengersCount > 0) ?? null;
  const total = withPassengers?.reduce((sum, bus) => sum + bus.passengersCount, 0);

  return (
    <Section
      title="Usuarios en buses"
      count={countLabel(withPassengers, total)}
      open={open}
      onToggle={setOpen}
    >
      <Empty list={withPassengers} />
      {withPassengers?.map((bus) => (
        <div key={bus.id} className={styles.row}>
          <div className={styles.rowInfo}>
            <p className={styles.rowTitle}>
              Unidad {bus.unidad} · {bus.passengersCount} pasajero
              {bus.passengersCount === 1 ? "" : "s"}
            </p>
            <p className={styles.rowMeta}>
              {empresaName(bus.empresa)} · {routeName(bus.routeId)}
            </p>
          </div>
        </div>
      ))}
    </Section>
  );
}

function AdminsSection({ selfUid }: { selfUid: string | undefined }) {
  const [open, setOpen] = useState(false);
  const admins = useMasterAdmins(open);

  return (
    <Section title="Admins" count={countLabel(admins)} open={open} onToggle={setOpen}>
      <Empty list={admins} />
      {admins?.map((admin) => (
        <AdminRow key={admin.id} admin={admin} isSelf={admin.id === selfUid} />
      ))}
    </Section>
  );
}

function EmpresaSection({ option, parentOpen }: { option: EmpresaOption; parentOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const isBike = option.mobilityType === MobilityType.Bike;
  // Solo lee si esta empresa Y la lista "Empresas" están abiertas
  const reading = open && parentOpen;
  const buses = useMasterBuses(reading && !isBike, { empresa: option.empresa });
  const bikes = useMasterBikes(reading && isBike, option.empresa);
  const admins = useMasterAdmins(reading, option.empresa);
  const units = isBike ? bikes : buses;

  const count =
    units === null || admins === null
      ? "—"
      : `${units.length} ${isBike ? "bicis" : "unidades"} · ${admins.length} admins`;

  return (
    <Section nested title={option.name} count={count} open={open} onToggle={setOpen}>
      <div className={styles.actions}>
        <button
          type="button"
          className={gateStyles.signOutButton}
          onClick={() => setShowRegister(true)}
        >
          Registrar {isBike ? "bici" : "unidad"}
        </button>
      </div>
      <Empty list={units} />
      {isBike
        ? bikes?.map((bike) => <BikeRow key={bike.id} bike={bike} />)
        : buses?.map((bus) => <BusRow key={bus.id} bus={bus} />)}

      {showRegister &&
        (isBike ? (
          <RegisterBikeModal empresa={option.empresa} onClose={() => setShowRegister(false)} />
        ) : (
          <RegisterBusModal empresa={option.empresa} onClose={() => setShowRegister(false)} />
        ))}
    </Section>
  );
}

const MOBILITY_GROUPS = [
  { mobilityType: MobilityType.Bus, title: "Bus" },
  { mobilityType: MobilityType.Bike, title: "Bici" },
];

/** Lista colapsable con las empresas de un tipo de movilidad. No lee nada por sí sola. */
function EmpresasByMobilitySection({
  mobilityType,
  title,
}: {
  mobilityType: MobilityType;
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const options = EMPRESA_OPTIONS.filter((option) => option.mobilityType === mobilityType);

  return (
    <Section title={title} count={String(options.length)} open={open} onToggle={setOpen}>
      {options.length === 0 && <p className={styles.empty}>Sin empresas.</p>}
      {options.map((option) => (
        <EmpresaSection key={option.empresa} option={option} parentOpen={open} />
      ))}
    </Section>
  );
}

function EmpresasSection() {
  return (
    <div className={styles.group}>
      <p className={styles.groupTitle}>Empresas</p>
      {MOBILITY_GROUPS.map((group) => (
        <EmpresasByMobilitySection
          key={group.mobilityType}
          mobilityType={group.mobilityType}
          title={group.title}
        />
      ))}
    </div>
  );
}

function AllBusesSection({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false);
  const buses = useMasterBuses(open && visible);

  return (
    <Section title="Buses" count={countLabel(buses)} open={open} onToggle={setOpen}>
      <Empty list={buses} />
      {buses?.map((bus) => <BusRow key={bus.id} bus={bus} showEmpresa />)}
    </Section>
  );
}

function AllBikesSection({ visible }: { visible: boolean }) {
  const [open, setOpen] = useState(false);
  const bikes = useMasterBikes(open && visible);

  return (
    <Section title="Bikes" count={countLabel(bikes)} open={open} onToggle={setOpen}>
      <Empty list={bikes} />
      {bikes?.map((bike) => <BikeRow key={bike.id} bike={bike} showEmpresa />)}
    </Section>
  );
}

/** Solo existe mientras el mapa está visible. Cada botón apaga la lectura de su tipo. */
function MasterMap() {
  const [showBuses, setShowBuses] = useState(true);
  const [showBikes, setShowBikes] = useState(true);
  const buses = useMasterBuses(showBuses, { onlyApproved: true });
  const bikes = useMasterBikes(showBikes);
  useStaleTick();

  return (
    <MasterMapMapKit
      buses={buses ?? []}
      bikes={bikes ?? []}
      showBuses={showBuses}
      showBikes={showBikes}
      onToggleBuses={() => setShowBuses((prev) => !prev)}
      onToggleBikes={() => setShowBikes((prev) => !prev)}
    />
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function MasterPanel() {
  const { user, nombre } = useAdminAuth();
  const [showMap, setShowMap] = useState(false);
  const firstName = nombre?.trim().split(/\s+/)[0];

  return (
    <div className={`${gateStyles.gate} ${gateStyles.messageBlock}`}>
      <div className={gateStyles.statsRow}>
        <p className={gateStyles.message}>Bienvenido{firstName ? `, ${firstName}` : ""}.</p>
        <p className={gateStyles.message}>Cuenta maestra</p>
      </div>

      <div className={styles.panel}>
        <ActiveDriversSection />
        <PassengersSection />
        <AdminsSection selfUid={user?.uid} />
        <EmpresasSection />
      </div>

      <button
        type="button"
        className={gateStyles.signOutButton}
        onClick={() => setShowMap((prev) => !prev)}
      >
        {showMap ? "Ocultar mapa" : "Mostrar mapa"}
      </button>

      {showMap && <MasterMap />}

      {/* Se quedan montadas (ocultas) para conservar lo último leído; con el mapa oculto no leen */}
      <div className={styles.panel} hidden={!showMap}>
        <AllBusesSection visible={showMap} />
        <AllBikesSection visible={showMap} />
      </div>
    </div>
  );
}
