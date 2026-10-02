"use client";

import { useState } from "react";
import { deleteField, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  BIKE_STATUS_LABEL,
  BIKE_TYPE_LABEL,
  BikeStatus,
  BikeType,
  TRIP_TYPE_LABEL,
} from "@/data/bike_types";
import { hasActiveRide, type LatLng, type LiveBike } from "@/hooks/use_live_bikes";
import { db } from "@/lib/firebase";
import styles from "@/components/admin_gate/admin_gate.module.css";

function formatDate(date: Date | null) {
  return date ? date.toLocaleString("es-MX") : "—";
}

function formatLocation(location: LatLng | null) {
  return location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "—";
}

// rider_id y trip_type los escribe la app: aquí son solo lectura
interface Draft {
  brand: string;
  model: string;
  bike_type: BikeType | "";
  status: BikeStatus;
}

function toDraft(bike: LiveBike): Draft {
  return {
    brand: bike.brand,
    model: bike.model,
    bike_type: bike.bike_type ?? "",
    status: bike.status,
  };
}

// Estados que el admin puede elegir (Unknown es solo para valores no reconocidos)
const EDITABLE_STATUSES = Object.values(BikeStatus).filter((s) => s !== BikeStatus.Unknown);

export function BikeDetails({ bike }: { bike: LiveBike }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(bike));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function startEdit() {
    setDraft(toDraft(bike));
    setError(null);
    setEditing(true);
  }

  async function handleSave() {
    if (!db) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "bikes", bike.id), {
        brand: draft.brand.trim(),
        model: draft.model.trim(),
        bike_type: draft.bike_type || deleteField(),
        status: draft.status,
        updated_at: serverTimestamp(),
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error.");
    } finally {
      setSaving(false);
    }
  }

  // En modo normal se ocultan los campos sin dato; al editar se muestran todos
  const row = (label: string, content: React.ReactNode, hasValue: boolean) =>
    !editing && !hasValue ? null : (
      <p className={styles.busDetailRow}>
        <strong>{label}:</strong> {content}
      </p>
    );

  const text = (key: "brand" | "model", shown: string) =>
    editing ? (
      <input
        className={styles.detailInput}
        value={draft[key]}
        onChange={(event) => update(key, event.target.value)}
      />
    ) : (
      shown || "—"
    );

  return (
    <div className={styles.busDetailsInfo}>
      {/* Bici */}
      {row("ID", bike.id, true)}
      {row("Número", bike.number || "—", Boolean(bike.number))}
      {row("Operador", bike.operator || "—", Boolean(bike.operator))}
      {row("Marca", text("brand", bike.brand), Boolean(bike.brand))}
      {row("Modelo", text("model", bike.model), Boolean(bike.model))}
      {row(
        "Tipo",
        editing ? (
          <select
            className={styles.detailInput}
            value={draft.bike_type}
            onChange={(event) => update("bike_type", event.target.value as BikeType | "")}
          >
            <option value="">—</option>
            {Object.values(BikeType).map((type) => (
              <option key={type} value={type}>
                {BIKE_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        ) : bike.bike_type ? (
          BIKE_TYPE_LABEL[bike.bike_type]
        ) : (
          "—"
        ),
        bike.bike_type !== null
      )}
      {row(
        "Estado",
        editing ? (
          <select
            className={styles.detailInput}
            value={draft.status}
            onChange={(event) => update("status", event.target.value as BikeStatus)}
          >
            {EDITABLE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {BIKE_STATUS_LABEL[status]}
              </option>
            ))}
          </select>
        ) : (
          BIKE_STATUS_LABEL[bike.status]
        ),
        true
      )}

      {/* Vínculo con usuario (solo lectura) */}
      {row("Vinculada a", bike.rider_id ?? "—", bike.rider_id !== null)}
      {row("Vinculada el", formatDate(bike.rider_linked_at), bike.rider_linked_at !== null)}
      {row(
        "Tipo de traslado",
        bike.trip_type ? TRIP_TYPE_LABEL[bike.trip_type] : "—",
        bike.trip_type !== null
      )}

      {/* Uso */}
      {row("Viajes totales", bike.total_rides, true)}
      {row("Último viaje", formatDate(bike.last_ride_at), bike.last_ride_at !== null)}
      {row(
        "Último mantenimiento",
        formatDate(bike.last_maintenance_at),
        bike.last_maintenance_at !== null
      )}

      {/* Ubicación: durante el ride, igual que "Ubicación" del bus; si no, la última (estacionada) */}
      {row("Estación base", bike.home_station_id ?? "—", bike.home_station_id !== null)}
      {hasActiveRide(bike) ? (
        row("Ubicación", formatLocation(bike.rider_location), true)
      ) : (
        <>
          {row("Última ubicación", formatLocation(bike.last_location), bike.last_location !== null)}
          {row(
            "Ubicación actualizada",
            formatDate(bike.last_location_at),
            bike.last_location_at !== null
          )}
        </>
      )}

      {/* Auditoría */}
      {row("Creada el", formatDate(bike.created_at), bike.created_at !== null)}
      {row("Creada por", bike.created_by || "—", Boolean(bike.created_by))}
      {row("Actualizada el", formatDate(bike.updated_at), bike.updated_at !== null)}

      {error && <p className={styles.deniedMessage}>{error}</p>}

      <div className={styles.detailActions}>
        {editing ? (
          <>
            <button
              type="button"
              className={styles.detailButton}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              className={styles.detailButton}
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className={styles.detailButton} onClick={startEdit}>
            Editar
          </button>
        )}
      </div>
    </div>
  );
}
